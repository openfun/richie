"""
API endpoints for the courses app.
"""
from django.utils.translation import gettext as _

from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ViewSet

from .lms import LMSHandler
from .models import CourseRun
from .serializers import CourseRunSerializer


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


class EnrollmentViewSet(ViewSet):
    """
    API endpoints to access enrollments.
    """

    permission_classes = [NotAllowed]

    def get_permissions(self):
        """
        Manage permissions for builtin DRF methods on ViewSets.
        """
        if self.action in ["create", "list"]:
            permission_classes = [IsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    # pylint: disable=no-self-use,invalid-name,unused-argument
    def create(self, request, *args, **kwargs):
        """
        Enroll the current user in the course run passed in params through the LMSHandled.
        """
        course_run = CourseRun.objects.get(id=request.data["course_run"])
        course_run_state = course_run.compute_state(
            course_run.start,
            course_run.end,
            course_run.enrollment_start,
            course_run.enrollment_end,
        )

        if course_run_state["priority"] >= 2:
            return Response(
                status=400,
                data={"errors": [_("Course run is not open for enrollments.")]},
            )

        is_enrolled = LMSHandler.set_enrollment(request.user, course_run.resource_link)

        if not is_enrolled:
            # We have no information on the error reason, thus cannot provide any message
            # to the user through our client
            return Response(
                status=400,
                data={"errors": [_("Enrollment failed on the LMS.")]},
            )

        # Return an empty response with a success code, which should be understood by the client
        # add a success
        return Response(status=201)

    def list(self, request, *args, **kwargs):
        """
        Use the LMSHandler to get the user's own enrollments for a given course run.

        As the LMS APIs are not guaranteed to provide a non-qualified list of all enrollments
        for a user, and it would be difficult to aggregate such a list for several disparate LMS,
        we're not allowing requests that do not qualify the relevant couse run for which we're
        getting enrollments.
        """
        # The LMSBackend interface does not make it possible to get all enrollments regardless of
        # the course run. If that parameter is not supplied, fail the request.
        if not request.query_params.get("course_run"):
            return Response(
                status=400,
                data={"errors": [_('The "course_run" parameter is mandatory.')]},
            )

        try:
            course_run = CourseRun.objects.get(
                id=request.query_params.get("course_run")
            )
        except CourseRun.DoesNotExist:
            return Response([])

        # Get and return the enrollment from the LMSHandler (which will make a request to the
        # appropriate LMSBackend or other resource).
        enrollment = LMSHandler.get_enrollment(request.user, course_run.resource_link)
        if enrollment:
            return Response([enrollment])

        # If there's no enrollment, return an empty list
        return Response([])
