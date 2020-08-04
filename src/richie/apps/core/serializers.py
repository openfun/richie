"""Serializers for Richie's core app."""
from django.contrib.auth import get_user_model

from rest_framework.serializers import ModelSerializer, SerializerMethodField


class UserSerializer(ModelSerializer):
    """Serializer for User objects."""

    full_name = SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ["full_name", "username"]

    @staticmethod
    def get_full_name(user):
        """Get the user's full_name on the User class during serialization."""
        return user.get_full_name()
