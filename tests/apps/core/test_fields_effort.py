"""Test suite for Richie's PaceField Django models field."""
from unittest import mock

from django.db import models
from django.test import TestCase

from richie.apps.core.fields.pace import PaceField


@mock.patch.object(models.CharField, "check", return_value=[])
class CheckPaceFieldTestCase(TestCase):
    """Test suite for the `PaceField` class."""

    def test_fields_pace_time_units_required(self, _mock_check):
        """The `time_units` attribute is required on the field."""
        field = PaceField()
        errors = field.check()
        self.assertEqual(len(errors), 1)
        error = errors[0]
        self.assertEqual(
            error.msg, "pace fields must define a 'time_units' attribute."
        )
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1010")

    def test_fields_pace_time_units_tuple(self, _mock_check):
        """The `time_units` object passed to instantiate an pace field should be a dictionary."""
        field = PaceField(time_units=(("minute", "minute"),))

        errors = field.check()
        self.assertEqual(len(errors), 1)

        error = errors[0]
        self.assertEqual(error.msg, "'time_units' must be a dictionary of tuples.")
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1011")

    def test_fields_pace_time_units_dictionary_string(self, _mock_check):
        """
        The `time_units` object should list singular/plural string tuples for each possible
        time unit choice.
        """
        field = PaceField(time_units={"minute": "minute"})

        errors = field.check()
        self.assertEqual(len(errors), 1)

        error = errors[0]
        self.assertEqual(error.msg, "'time_units' must be a dictionary of tuples.")
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1011")

    def test_fields_pace_time_units_dictionary_success(self, _mock_check):
        """Successfuly instantiate an pace field with a valid definition of time_units."""
        field = PaceField(time_units={"minute": ("minute", "minutes")})

        errors = field.check()
        self.assertEqual(len(errors), 0)

    def test_fields_pace_default_pace_unit_invalid(self, _mock_check):
        """
        Trying to instantiate an pace field with an invalid default pace unit should
        not pass the checks.
        """
        field = PaceField(
            time_units={"minute": ("minute", "minutes")}, default_pace_unit="invalid"
        )

        errors = field.check()
        self.assertEqual(len(errors), 1)

        error = errors[0]
        self.assertEqual(error.msg, "'invalid' is not a valid time unit.")
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1012")

    def test_fields_pace_default_pace_unit_success(self, _mock_check):
        """Successfully instantiating an pace field with a default pace unit."""
        field = PaceField(
            time_units={"minute": ("minute", "minutes")}, default_pace_unit="minute"
        )

        errors = field.check()
        self.assertEqual(len(errors), 0)

    def test_fields_pace_default_reference_unit_invalid(self, _mock_check):
        """
        Trying to instantiate an pace field with an invalid default reference unit should
        not pass the checks.
        """
        field = PaceField(
            time_units={"minute": ("minute", "minutes")},
            default_reference_unit="invalid",
        )

        errors = field.check()
        self.assertEqual(len(errors), 1)

        error = errors[0]
        self.assertEqual(error.msg, "'invalid' is not a valid time unit.")
        self.assertEqual(error.obj, field)
        self.assertEqual(error.id, "fields.E1013")

    def test_fields_pace_default_reference_unit_success(self, _mock_check):
        """Successfully instantiating an pace field with a default reference unit."""
        field = PaceField(
            time_units={"minute": ("minute", "minutes")},
            default_reference_unit="minute",
        )

        errors = field.check()
        self.assertEqual(len(errors), 0)
