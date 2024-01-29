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


class ReactPropsCourseRunSerializer(serializers.ModelSerializer):
    """
    Course run serializer for React Course Runs List Widget props.
    """

    languages = ListMultipleChoiceField(choices=lazy(lambda: ALL_LANGUAGES, tuple)())
    snapshot = serializers.SerializerMethodField()

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
            "catalog_visibility",
            "display_mode",
            "snapshot",
        ]

    def get_snapshot(self, course_run):
        """
        Get the snapshot url for the course run.
        """
        course = self.context.get("course")
        if course is not None and course != course_run.direct_course:
            return course_run.direct_course.extended_object.get_absolute_url()

        return None


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
