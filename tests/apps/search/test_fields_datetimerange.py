"""
Tests for the DatetimeRangeField custom django form field
"""

from datetime import datetime

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

import arrow

from richie.apps.search.fields.datetimerange import DatetimeRangeField


class DatetimeRangeFieldsTestCase(TestCase):
    """
    Test whether our DatetimeRangeField returns the proper value when it is valid and properly
    reports any errors when it is invalid
    """

    def setUp(self):
        """
        Make sure all our tests are timezone-agnostic. As we're using datetimes, our tests would
        be dependent upon the host machine's timezone otherwise.
        """
        timezone.activate("UTC")

    def test_fields_datetime_range_no_input_optional(self):
        """
        Happy path: the value is optional and was not provided
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=False)
        # None is valid input as the field is not required
        self.assertEqual(daterange.clean(None), None)

    def test_fields_datetime_range_no_input_required(self):
        """
        Invalid input: the value is required but missing
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)
        # None is not valid input when the field is required
        with self.assertRaises(ValidationError) as context:
            daterange.clean(None)
        self.assertEqual(context.exception.message, "Missing required field")

    def test_fields_datetime_range_empty_array_input(self):
        """
        Invalid input: an empty array does not satisfy the "required" condition
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)
        # The field raises an error, an empty array is the same as no value
        with self.assertRaises(ValidationError) as context:
            daterange.clean("[]")
        self.assertEqual(context.exception.message, "Empty datetimerange is invalid")

    def test_fields_datetime_range_broken_input_python_list(self):
        """
        Invalid input: a python list is not proper JSON
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)
        # The field is not supposed to receive a python list (from e.g. an array
        # query string param), and raises an error
        with self.assertRaises(ValidationError) as context:
            daterange.clean([])
        self.assertEqual(context.exception.message, "Missing required field")

    def test_fields_datetime_range_broken_input_not_json(self):
        """
        Invalid input: an eval-able tuple as a string is not proper JSON
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)
        # The field is supposed to receive JSON, not eval-able python code
        with self.assertRaises(ValidationError) as context:
            daterange.clean('("2018-01-01T06:00:00Z", null)')
        self.assertEqual(context.exception.message, "Invalid JSON formatting")

    def test_fields_datetime_range_array_of_null_input(self):
        """
        Invalid input: [null, null] is no use at all as a daterange and probably a client-side
        error, we should not accept it as correct input
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=False)
        # We need at least one datetime: the field raises an error
        with self.assertRaises(ValidationError) as context:
            daterange.clean("[null, null]")
        self.assertEqual(
            context.exception.message, "A valid datetimerange needs at least 1 datetime"
        )

    def test_fields_datetime_range_start_and_null_input(self):
        """
        Happy path: only a start is provided for the daterange
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)
        # The field is marked as valid and returns a tuple with a datetime and None
        self.assertEqual(
            daterange.clean('["2018-01-01T06:00:00Z", null]'),
            (arrow.get(datetime(2018, 1, 1, 6, 0), "UTC"), None),
        )

    def test_fields_datetime_range_null_and_end_input(self):
        """
        Happy path: only an end is provided for the daterange
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)
        # The field is marked as valid and returns a tuple with None and a datetime
        self.assertEqual(
            daterange.clean('[null, "2018-01-31T06:00:00Z"]'),
            (None, arrow.get(datetime(2018, 1, 31, 6, 0), "UTC")),
        )

    def test_fields_datetime_range_start_and_end_input(self):
        """
        Happy path: we got 2 datetimes, a start & an end for our daterange
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)
        # We pass 2 ISO dates this time, just like a JS client would do. The field is valid and
        # returns a tuple with our two datetimes, which is effectively a daterange
        self.assertEqual(
            daterange.clean('["2018-01-01T06:00:00Z", "2018-01-31T06:00:00Z"]'),
            (
                arrow.get(datetime(2018, 1, 1, 6, 0), "UTC"),
                arrow.get(datetime(2018, 1, 31, 6, 0), "UTC"),
            ),
        )

    def test_fields_datetime_range_start_and_end_with_timezones_input(self):
        """
        Happy path: the consumer provides ISO datetimes with timezones, which are valid input
        for our form field.
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)

        # Pass 2 ISO dates with different timezone data. The field is valid and returns a tuple
        # with two datetimes and properly set timezones
        self.assertEqual(
            daterange.clean(
                '["2018-01-01T06:00:00+02:00", "2018-01-31T06:00:00+05:00"]'
            ),
            (
                arrow.get(
                    datetime(2018, 1, 1, 6, 0), "Africa/Cairo"
                ),  # A timezone with +2h
                arrow.get(
                    datetime(2018, 1, 31, 6, 0), "Indian/Kerguelen"
                ),  # A timezone with +5h
            ),
        )

    def test_fields_datetime_range_invalid_date_format_input(self):
        """
        Invalid input: the date format is not ISO and therefore not recognized by arrow and
        our own form field.
        """
        # Create a DatetimeRangeField instance with some params
        daterange = DatetimeRangeField(required=True)

        with self.assertRaises(ValidationError) as context:
            daterange.clean('[null, "Mardi 27 mars à 16 heures heure de Paris"]')
        self.assertEqual(
            context.exception.message, "Invalid datetime format; use ISO 8601"
        )
