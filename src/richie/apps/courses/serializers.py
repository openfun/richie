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
            "price",
            "price_currency",
            "offer",
            "certificate_price",
            "certificate_offer",
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
            "price",
            "price_currency",
            "offer",
            "certificate_price",
            "certificate_offer",
        ]


class SyncCourseRunSerializer(serializers.ModelSerializer):
    """
    Course run hook serializer.
    """

    languages = ListMultipleChoiceField(choices=lazy(lambda: ALL_LANGUAGES, tuple)())
    price = serializers.DecimalField(
        max_digits=9,
        decimal_places=2,
        allow_null=True,
        required=False,
    )
    price_currency = serializers.CharField(
        max_length=7,
        allow_null=True,
        required=False,
    )
    offer = serializers.CharField(
        allow_null=True,
        max_length=20,
        required=False,
    )
    certificate_price = serializers.DecimalField(
        max_digits=9,
        decimal_places=2,
        allow_null=True,
        required=False,
    )
    certificate_offer = serializers.CharField(
        allow_null=True,
        max_length=20,
        required=False,
    )

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
            "price",
            "price_currency",
            "offer",
            "certificate_price",
            "certificate_offer",
        ]
        extra_kwargs = {"resource_link": {"required": True}}
