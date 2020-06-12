"""Serializers for Richie's courses app."""
from rest_framework import serializers

from .models import CourseRun


class CourseRunSerializer(serializers.ModelSerializer):
    """
    Course run serializer. Includes state but not any nested object or CMS page information.
    """

    class Meta:
        model = CourseRun
        fields = [
            "id",
            "resource_link",
            "start",
            "end",
            "enrollment_start",
            "enrollment_end",
            "languages",
            "state",
        ]
