"""Test suite for Richie's CompositeDurationField Django models field."""

from unittest import mock

from django.db import models
from django.test import TestCase

from richie.apps.core.fields.duration import CompositeDurationField


@mock.patch.object(models.CharField, "check", return_value=[])
class CheckCompositeDurationFieldTestCase(TestCase):
    """Test suite for the `CompositeDurationField` class."""

    def test_fields_duration_time_units_required(self, _mock_check):
        """The `time_units` attribute is required on the field."""
        field = CompositeDurationField()
        errors = field.check()
        self.assertEqual(len(errors), 1)
        error = errors[0]
        self.assertEqual(
            error.msg, "CompositeDuration fields must define a 'time_units' attribute."
        )
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1020")

    def test_fields_duration_time_units_tuple(self, _mock_check):
        """
        The `time_units` object passed to instantiate a composite duration field should be a
        dictionary.
        """
        field = CompositeDurationField(time_units=(("minute", "minute"),))

        errors = field.check()
        self.assertEqual(len(errors), 1)

        error = errors[0]
        self.assertEqual(error.msg, "'time_units' must be a dictionary of tuples.")
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1021")

    def test_fields_duration_time_units_dictionary_string(self, _mock_check):
        """
        The `time_units` object should list singular/plural string tuples for each possible
        time unit choice.
        """
        field = CompositeDurationField(time_units={"minute": "minute"})

        errors = field.check()
        self.assertEqual(len(errors), 1)

        error = errors[0]
        self.assertEqual(error.msg, "'time_units' must be a dictionary of tuples.")
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1021")

    def test_fields_duration_time_units_dictionary_success(self, _mock_check):
        """
        Successfuly instantiate a composite duration field with a valid definition of time_units.
        """
        field = CompositeDurationField(time_units={"minute": ("minute", "minutes")})

        errors = field.check()
        self.assertEqual(len(errors), 0)

    def test_fields_duration_default_unit_invalid(self, _mock_check):
        """
        Trying to instantiate a composite duration field with an invalid default time unit should
        not pass the checks.
        """
        field = CompositeDurationField(
            time_units={"minute": ("minute", "minutes")}, default_unit="invalid"
        )

        errors = field.check()
        self.assertEqual(len(errors), 1)

        error = errors[0]
        self.assertEqual(error.msg, "'invalid' is not a valid time unit.")
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1022")

    def test_fields_duration_default_unit_success(self, _mock_check):
        """Successfully instantiating a composite duration field with a default time unit."""
        field = CompositeDurationField(
            time_units={"minute": ("minute", "minutes")}, default_unit="minute"
        )

        errors = field.check()
        self.assertEqual(len(errors), 0)
