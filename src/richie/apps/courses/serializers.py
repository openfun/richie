"""Serializers for Richie's courses app."""
from django.utils.functional import lazy

from rest_framework import serializers

from richie.apps.core.defaults import ALL_LANGUAGES

from .models import CourseRun


class ListMultipleChoiceField(serializers.MultipleChoiceField):
    """
    Override DRF's MultipleChoiceField to represent it as a list.
    We don't want choices to render as a set e.g. {"en", "fr"}
    """

    def to_representation(self, value):
        return sorted(list(super().to_representation(value)))


class CourseRunSerializer(serializers.ModelSerializer):
    """
    Course run serializer. Includes state but not any nested object.
    """

    languages = ListMultipleChoiceField(choices=lazy(lambda: ALL_LANGUAGES, tuple)())

    class Meta:
        model = CourseRun
        fields = [
            "id",
            "title",
            "resource_link",
            "start",
            "end",
            "enrollment_start",
            "enrollment_end",
            "languages",
            "state",
            "enrollment_count",
            "catalog_visibility",
        ]


class SyncCourseRunSerializer(serializers.ModelSerializer):
    """
    Course run hook serializer.
    """

    languages = ListMultipleChoiceField(choices=lazy(lambda: ALL_LANGUAGES, tuple)())

    class Meta:
        model = CourseRun
        fields = [
            "resource_link",
            "start",
            "end",
            "enrollment_start",
            "enrollment_end",
            "languages",
            "enrollment_count",
            "catalog_visibility",
        ]
        extra_kwargs = {"resource_link": {"required": True}}
