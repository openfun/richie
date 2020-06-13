"""
API endpoints for the enrollments app.
"""

from django.db import IntegrityError
from django.utils.translation import gettext as _

from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from richie.apps.courses.models import CourseRun

from .models import Enrollment
from .serializers import EnrollmentSerializer


class EnrollmentViewSet(ModelViewSet):
    """
    API endpoints to access enrollments.
    """

    permission_classes = [IsAdminUser]
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        """
        Manage permissions for builtin DRF methods on ViewSets.
        """
        if self.action == "create":
            permission_classes = [IsAuthenticated]
        elif self.action in ["retrieve", "list"]:
            permission_classes = []
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Limit the queryset for enrollments to the current user's own enrollments. Use an empty
        queryset for anonymous users as we don't want to return errors when requests are made
        by anonymous users.
        """
        if self.request.user.is_authenticated:
            queryset = Enrollment.objects.filter(user=self.request.user)

            if self.request.query_params.get("course_run"):
                return queryset.filter(
                    course_run__id=self.request.query_params.get("course_run")
                )

            return queryset

        return Enrollment.objects.none()

    # pylint: disable=no-self-use,invalid-name,unused-argument
    def create(self, request, *args, **kwargs):
        """
        Enroll the current user in the course run passed in params by creating a new Enrollment.
        """

        course_run = CourseRun.objects.get(id=request.data["course_run_id"])
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

        try:
            enrollment = Enrollment.objects.create(
                user=request.user, course_run=course_run
            )
        except IntegrityError:
            return Response(
                status=400,
                data={"errors": [_("User is already enrolled in this course run.")]},
            )

        return Response(EnrollmentSerializer(enrollment).data, status=201)
