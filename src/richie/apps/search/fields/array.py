"""
Utility Django form fields that lets us validate every individual entry in an array,
using the Django-provided validator for that type of field
"""

from django import forms
from django.core.exceptions import ValidationError


class ArrayField(forms.Field):
    """
    Custom form field type that lets us validate and clean arrays of items, where both the array
    itself and each of its items are validated through the Django Form
    """

    def __init__(self, *args, **kwargs):
        """
        Get a hold of our custom arguments and delegate the rest to Field
        """
        # base_type is unknown to Field: pop it out of kwargs and keep it ourselves
        self.base_type = kwargs.pop("base_type")
        # Core arguments, including 'required', are left in the kwargs and handled by parent
        super().__init__(*args, **kwargs)

    def clean(self, value):
        """
        Validate our array and iterate over it, delegating item validation to the base_type that
        was passed to us by the consumer
        """
        if value:
            # Support comma-separated lists in addition to the traditional repeated-key format
            # for query string parameters containing lists.
            if isinstance(value, list) and len(value) == 1 and "," in value[0]:
                value = value[0].split(",")
            # We have something to check: attempt to iterate over it
            try:
                for base_type_value in value:
                    self.base_type.validate(base_type_value)
                return [
                    self.base_type.clean(base_type_value) for base_type_value in value
                ]
            # Iteration over subvalues failed, the value was invalid
            except TypeError as error:
                raise ValidationError(
                    "Failed to iterate over value, got a non-iterable type."
                ) from error
        # We're missing a required value
        elif self.required:
            raise ValidationError("Missing required value.")
        # Default to returning an empty array when an optional value is missing to simplify
        # the job for consumers of the form's data
        else:
            return []
