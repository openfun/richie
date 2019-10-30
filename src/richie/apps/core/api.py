"""
API endpoints for the core app.
"""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .serializers import UserSerializer


class UsersViewSet(ViewSet):
    """
    API endpoints to access users.
    """

    @action(detail=False)
    # pylint: disable=no-self-use,invalid-name,unused-argument
    def whoami(self, request, version):
        """
        Get information on the current user. This is the only implemented user-related endpoint.
        """
        # If the user is not logged in, the request has no object. Return a 401 so the caller
        # knows they need to log in first.
        if not request.user.is_authenticated:
            return Response(status=401)

        # Serialize the user with a minimal subset of existing fields and return it.
        serialized_user = UserSerializer(request.user)
        return Response(data=serialized_user.data)
