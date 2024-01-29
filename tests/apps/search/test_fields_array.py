"""
Tests for the ArrayField custom django form field
"""

from django import forms
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import translation

from richie.apps.search.fields.array import ArrayField


class ArrayFieldsTestCase(TestCase):
    """
    Test whether our custom form field returns the proper value when it is valid and
    properly reports it when it is invalid
    """

    def setUp(self):
        """
        Force i18n language so we can check the value of error messages without having our tests
        broken when the local language on the host machine changes
        """
        translation.activate("en")

    def test_fields_array_valid_int(self):
        """
        Happy path: the value is an array and all its items are valid as per the base_type
        """
        # Create an ArrayField instance with some params
        array_of_int = ArrayField(
            required=False, base_type=forms.IntegerField(min_value=1)
        )
        # The field is valid and returns cleaned data
        self.assertEqual(array_of_int.clean([1, 2, 3, 5, 7]), [1, 2, 3, 5, 7])

    def test_field_array_comma_separated_values(self):
        """
        Happy path: the array field supports a string comprised of comma-separated values of
        the base type.
        """
        # Create an ArrayField instance with some params
        array_of_int = ArrayField(
            required=False, base_type=forms.CharField(max_length=50)
        )
        # The field is valid and returns cleaned data
        self.assertEqual(array_of_int.clean(["A21,C42,Y84"]), ["A21", "C42", "Y84"])

    def test_fields_array_invalid_string(self):
        """
        Invalid input: the value is an array but at least 1 item is invalid
        """
        # Create an ArrayField instance with some params
        array_of_string = ArrayField(
            required=False, base_type=forms.CharField(max_length=4)
        )
        # Pass invalid values as per our CharField: the field raises an error
        with self.assertRaises(ValidationError) as context:
            array_of_string.clean(["ok", "too_long", "still"])
        self.assertEqual(
            context.exception.messages[0],
            "Ensure this value has at most 4 characters (it has 8).",
        )

    def test_fields_array_missing_required_array(self):
        """
        Invalid input: the value is required but missing
        """
        # Create an ArrayField instance with some params
        array_of_string = ArrayField(
            required=True, base_type=forms.CharField(max_length=4)
        )
        # The missing value causes the field to raise an error
        with self.assertRaises(ValidationError) as context:
            array_of_string.clean(None)
        self.assertEqual(context.exception.message, "Missing required value.")

    def test_fields_array_optional_value_not_provided(self):
        """
        Happy path: the value is optional and was not provided
        """
        # Create an ArrayField instance with some params
        array_of_string = ArrayField(
            required=False, base_type=forms.CharField(max_length=4)
        )
        # None is valid input and the field returns an empty array
        self.assertEqual(array_of_string.clean(None), [])

    def test_fields_array_single_value(self):
        """
        Invalid input: ArrayField expects an iterable type
        """
        # Create an ArrayField instance with some params
        array_of_string = ArrayField(
            required=False, base_type=forms.IntegerField(min_value=1)
        )
        # The single value, although it would be valid in a list, is not valid by itself
        with self.assertRaises(ValidationError) as context:
            array_of_string.clean(3.14)
        self.assertEqual(
            context.exception.message,
            "Failed to iterate over value, got a non-iterable type.",
        )
