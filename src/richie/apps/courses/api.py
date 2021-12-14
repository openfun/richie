"""
API endpoints for the courses app.
"""
from django.conf import settings
from django.db.models import Q

from cms import signals as cms_signals
from cms.models import Page
from rest_framework.decorators import api_view
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .lms import LMSHandler
from .models import Course, CourseRun, CourseRunSyncMode
from .serializers import CourseRunSerializer
from .utils import get_signature, normalize_code


class NotAllowed(BasePermission):
    """
    Utility permission class to deny all requests. This is used as a default to close
    requests to unsupported actions.
    """

    def has_permission(self, request, view):
        """
        Always deny permission.
        """
        return False


class CourseRunsViewSet(ModelViewSet):
    """
    API endpoints to access and perform actions on course runs.
    """

    permission_classes = [NotAllowed]
    queryset = CourseRun.objects.all()
    serializer_class = CourseRunSerializer

    def get_permissions(self):
        """
        Manage permissions for builtin DRF methods on ViewSets.
        """
        if self.action == "retrieve":
            permission_classes = []
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]


# pylint: disable=too-many-return-statements,unused-argument, too-many-locals,too-many-branches
@api_view(["POST"])
def course_runs_sync(request, version):
    """View for the web hook to create or update course runs based on their resource link.

    - An existing course run is updated only if its "sync_mode" field is set to something else
      than "manual".

    - The public version of a course run is updated only if its "sync_mode" field is set to
      "sync_to_public". Otherwise, only the draft version is updated and the related course
      is marked dirty.

    - A new course run is created only if the "DEFAULT_COURSE_RUN_SYNC_MODE" parameter is set
      to something else than "manual" in the lms configuration (or the setting
      "RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE" in the absence of LMS preference). Otherwise, only
      existing course runs are updated.

    - A new public course run is created only if the "DEFAULT_COURSE_RUN_SYNC_MODE" parameter
      is set to "sync_to_public" in the lms configuration (or the setting
      "RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE" in the absence of LMS preference). Otherwise, only
      the draft course run is created and the related course is marked dirty.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it should contain a payload with course run fields.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse acknowledging the success or failure of the synchronization operation.
    """
    message = request.body.decode("utf-8")

    # Check if the provided signature is valid against any secret in our list
    #
    # We need to do this to support 2 or more versions of our infrastructure at the same time.
    # It then enables us to do updates and change the secret without incurring downtime.
    authorization_header = request.headers.get("Authorization")
    if not authorization_header:
        return Response("Missing authentication.", status=403)

    signature_is_valid = any(
        authorization_header == get_signature(message, secret)
        for secret in getattr(settings, "RICHIE_COURSE_RUN_SYNC_SECRETS", [])
    )

    if not signature_is_valid:
        return Response("Invalid authentication.", status=401)

    # Select LMS from resource link
    resource_link = request.data.get("resource_link")
    if not resource_link:
        return Response({"resource_link": ["This field is required."]}, status=400)

    lms = LMSHandler.select_lms(resource_link)
    if lms is None:
        return Response(
            {"resource_link": ["No LMS configuration found for this resource link."]},
            status=400,
        )
    sync_mode = lms.default_course_run_sync_mode

    target_course_runs = CourseRun.objects.filter(resource_link=resource_link)
    draft_course_runs = target_course_runs.filter(draft_course_run__isnull=True)

    # Remove protected fields before update and transform
    data = lms.clean_course_run_data(request.data)

    serializer = lms.get_course_run_serializer(data, partial=bool(draft_course_runs))

    if serializer.is_valid() is not True:
        return Response(serializer.errors, status=400)
    validated_data = serializer.validated_data

    if draft_course_runs:

        for course_run in draft_course_runs.filter(
            sync_mode__in=[
                CourseRunSyncMode.SYNC_TO_DRAFT,
                CourseRunSyncMode.SYNC_TO_PUBLIC,
            ]
        ):
            nb_updated = CourseRun.objects.filter(
                Q(pk=course_run.pk)
                | Q(
                    draft_course_run__sync_mode=CourseRunSyncMode.SYNC_TO_PUBLIC,
                    draft_course_run=course_run,
                )
            ).update(**validated_data)

            public_course = course_run.direct_course.public_extension
            if course_run.sync_mode == CourseRunSyncMode.SYNC_TO_PUBLIC:
                if public_course:
                    # If the public course run did not exist yet it has to be created
                    if nb_updated == 1:
                        public_course.copy_relations(course_run.direct_course)

                    # What we did has changed the public course page. We must reindex it
                    cms_signals.post_publish.send(
                        sender=Page,
                        instance=course_run.direct_course.extended_object,
                        language=None,
                    )
            else:
                course_run.refresh_from_db()
                course_run.mark_course_dirty()
        return Response({"success": True})

    # We need to create a new course run
    if lms.default_course_run_sync_mode == CourseRunSyncMode.MANUAL:
        return Response(
            {"resource_link": ["Unknown course run when creation is deactivated."]},
            status=400,
        )

    # Look for the course targeted by the resource link
    course_number = normalize_code(lms.extract_course_number(request.data))
    try:
        course = Course.objects.get(
            code=course_number, extended_object__publisher_is_draft=True
        )
    except Course.DoesNotExist:
        return Response(
            {"resource_link": [f"Unknown course: {course_number:s}."]}, status=400
        )

    # Instantiate a new draft course run
    draft_course_run = CourseRun(
        direct_course=course, sync_mode=sync_mode, **validated_data
    )

    # Create the related public course run if necessary
    if sync_mode == CourseRunSyncMode.SYNC_TO_PUBLIC:
        # Don't mark the related course page dirty and directly add
        # the course run to the corresponding public course page
        draft_course_run.save()
        if course.public_extension_id:
            public_course_run = CourseRun(
                direct_course=course.public_extension,
                draft_course_run=draft_course_run,
                sync_mode=sync_mode,
                **validated_data,
            )
            public_course_run.save()

            # What we did has changed the public course page. We must reindex it
            cms_signals.post_publish.send(
                sender=Page, instance=course.extended_object, language=None
            )
    else:
        # Save the draft course run marking the course page dirty
        draft_course_run.save()
        draft_course_run.mark_course_dirty()

    return Response({"success": target_course_runs.exists()})
