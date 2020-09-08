"""Serializers for Richie's core app."""
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.serializers import ModelSerializer, SerializerMethodField


class UserSerializer(ModelSerializer):
    """Serializer for User objects."""

    full_name = SerializerMethodField()
    urls = SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ["full_name", "urls", "username"]

    @staticmethod
    def get_full_name(user):
        """Get the user's full_name on the User class during serialization."""
        return user.get_full_name()

    @staticmethod
    def get_urls(user):
        """Get the user's urls related to LMS"""
        return [
            {
                key: value.format(
                    base_url=settings.LMS_BACKENDS[0]["BASE_URL"],
                    username=user.username,
                )
                for key, value in link.items()
            }
            for link in settings.MAIN_LMS_USER_URLS
        ]
