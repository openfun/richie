"""
Utility django form field that lets us validate and clean datetimeranges received from the API,
ensuring there is at least one date and any supplied date is valid
"""

import json

from django import forms
from django.core.exceptions import ValidationError

import arrow


class DatetimeRangeField(forms.Field):
    """
    Check each of the datetimess using the basic DateTimeField but with custom date formats to
    support actual ISO strings, and return either None or a tuple as a daterange

    Valid input examples:
    - '["2018-01-01T06:00:00Z", null]'
    - '[null, "2018-01-01T06:00:00Z"]'
    - '["2018-01-01T06:00:00Z", "2018-01-31T06:00:00Z"]'
    - '["2018-01-01T06:00:00Z", "2018-02-01T06:00:00+04:00"]'
    - '["2018-01-01T06:00:00", "2018-02-01T06:00:00Z"]'
    """

    def clean(self, value):
        """
        Validate our string and each of the datetimes passed into it, using regular DateTimeFields
        for item validation
        """
        # Handle null values: either we're missing a required value
        if not value and self.required:
            raise ValidationError("Missing required field")
        # Or the null value is optional: return None and exit
        if not value:
            return None

        # Decode our incoming JSON array and unpack it all at once
        try:
            iso_start, iso_end = json.loads(value)
        # JSON parsing failed: blame the formatting
        except json.JSONDecodeError as error:
            raise ValidationError("Invalid JSON formatting") from error
        # Unpacking failed: input was not a list of a least 2 values
        except ValueError as error:
            raise ValidationError("Empty datetimerange is invalid") from error
        # Sanity check: don't throw a 500 when the param is entirely wrong
        except TypeError as error:
            raise ValidationError(
                "Invalid parameter type: must be a JSON array"
            ) from error

        # Reject input that is made up of falsy values
        if not iso_start and not iso_end:
            raise ValidationError("A valid datetimerange needs at least 1 datetime")

        try:
            datetime_range = tuple(
                arrow.get(iso_datetime) if iso_datetime else None
                for iso_datetime in (iso_start, iso_end)
            )
        except arrow.parser.ParserError as error:
            raise ValidationError("Invalid datetime format; use ISO 8601") from error

        return datetime_range
