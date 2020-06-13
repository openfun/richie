"""Serializers for Richie's enrollments app."""
from rest_framework import serializers

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Enrollment serializer. As Enrollment is a regular model without linked CMS objects, we can
    just serialize the model and return all of it.
    """

    class Meta:
        model = Enrollment
        fields = "__all__"
