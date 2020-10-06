"""
API endpoints for the courses app.
"""
from rest_framework.permissions import BasePermission
from rest_framework.viewsets import ModelViewSet

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
