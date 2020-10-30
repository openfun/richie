"""
A custom field that defines a duration as a number of pre-defined time units
(e.g 1 hour, 5 hours or 3 days)
"""
from django import forms
from django.core import checks, exceptions
from django.db import models
from django.db.utils import DataError
from django.forms import widgets
from django.utils.translation import gettext_lazy as _


class CompositeDurationWidget(widgets.MultiWidget):
    """
    A widget that splits the input of a duration into an integer input box and a select box.
    """

    template_name = "richie/forms/widgets/composite_widget.html"

    def __init__(self, attrs=None, choices=(), default_unit=None):
        """
        Split the field in 2 widgets:
        - the first widget is a positive integer input,
        - the second widget is a select box to choose a pre-defined time unit (minutes, hours,
          days, weeks or months),

        e.g: 3 hours is split in: 3 (integer input) | hour (select)
        """
        self.default_unit = default_unit
        super().__init__(
            (
                widgets.NumberInput({**(attrs or {}), "min": 0}),
                widgets.Select(attrs, choices),
            )
        )

    def decompress(self, value):
        """
        Return the raw value as it is already a pair [duration, unit].
        In the absence of a value, pre-configure the time unit select widget as defined
        in the field.
        """
        return value or ["", self.default_unit]


class CompositeDurationFormField(forms.CharField):
    """
    The composite duration field is saved in database as a charfield but represented in Python
    by a pair [duration,unit]. We should not force its value to str.
    """

    def to_python(self, value):
        """Return the raw value to avoid the charfield behavior that forces the value to str."""
        return value


class CompositeDurationField(models.CharField):
    """
    A custom charfield to store a duration in database as an integer and a time unit choice.
    """

    description = _("Define a duration as a number of time units")

    error_message = _("%(value)s is not a valid choice for a time unit.")

    def __init__(self, *args, **kwargs):
        """
        Record the two additional field attributes `time_units` and `default_unit` in the
        instance.
        """
        self.time_units = kwargs.pop("time_units", None)
        self.default_unit = kwargs.pop("default_unit", None)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        """Return enough information to recreate the field as a 4-tuple."""
        name, path, args, kwargs = super().deconstruct()
        kwargs["time_units"] = self.time_units
        kwargs["default_unit"] = self.default_unit
        return name, path, args, kwargs

    def _check_time_units_attribute(self):
        """Check that `time_units` is well configured."""
        if self.time_units is None:
            return [
                checks.Error(
                    "CompositeDuration fields must define a 'time_units' attribute.",
                    obj=self,
                    id="fields.E1020",
                )
            ]
        if not (
            isinstance(self.time_units, dict)
            and all(
                [isinstance(c, tuple) and len(c) == 2 for c in self.time_units.values()]
            )
        ):
            return [
                checks.Error(
                    "'time_units' must be a dictionary of tuples.",
                    obj=self,
                    id="fields.E1021",
                )
            ]

        return []

    def _check_default_unit_attribute(self):
        """Check that `default_unit` is well configured."""
        if self.default_unit and self.default_unit not in self.time_units:
            return [
                checks.Error(
                    "'{:s}' is not a valid time unit.".format(self.default_unit),
                    obj=self,
                    id="fields.E1022",
                )
            ]

        return []

    def check(self, **kwargs):
        """Add checks on `time_units` and `default_unit` to the field's checks."""
        return (
            super().check(**kwargs)
            + self._check_time_units_attribute()
            + self._check_default_unit_attribute()
        )

    @staticmethod
    def from_db_value(value, *_args):
        """Convert a database value to a list value."""
        if not value:
            return None

        try:
            duration, unit = value.split("|")
        except ValueError as error:
            raise DataError(
                "Value in database should be of the form '{duration:d}|{unit:s}'"
            ) from error

        if not duration:
            return None

        return int(duration), unit

    def to_python(self, value):
        """Convert a string value to a list value. Used for deserialization and in clean forms."""
        if isinstance(value, (list, tuple)):
            return value

        if not value:
            return None

        if isinstance(value, str):
            try:
                duration, unit = value.split("|")
            except ValueError as error:
                raise DataError(
                    "Value in database should be of the form '{duration:d}|{unit:s}'"
                ) from error

            return int(duration.strip()), unit.strip()

        return value

    def get_prep_value(self, value):
        """
        Transform the list value to a concatenation of "|" separated strings.

        Arguments:
        ----------
        value (List[string]): a list of strings representing the Python representation
            of an effort.

        Returns:
        --------
        string:
            None > None
            [0, "day"] > "0|day"
            [5, "day"] > "5|day"

        """
        if value is None:
            return None
        return "|".join([str(v).strip() for v in value])

    def value_to_string(self, obj):
        """Serialize the Python value. We can use existing methods as it is a CharField."""
        value = self.value_from_object(obj)
        return self.get_prep_value(value)

    def validate(self, value, model_instance):
        """
        Validate each value in values and raise a ValidationError if something is wrong.
        """
        if not self.editable:
            # Skip validation for non-editable fields.
            return

        if value:
            try:
                size = len(value)
            except TypeError:
                size = 0

            if size != 2:
                raise exceptions.ValidationError(
                    _("A composite duration should be a pair: number and time unit."),
                    code="invalid_format",
                )

            duration, unit = value

            if duration:
                # Check that the duration is an integer
                try:
                    duration = int(duration)
                except ValueError as error:
                    raise exceptions.ValidationError(
                        _(
                            "A composite duration should be a round number of time units."
                        ),
                        code="invalid_duration",
                    ) from error

                # Check that the duration is positive
                if duration <= 0:
                    raise exceptions.ValidationError(
                        _("A composite duration should be positive."),
                        code="negative_duration",
                    )

            choices = list(dict(self.time_units))

            # Search the time unit in this set
            if unit not in choices:
                raise exceptions.ValidationError(
                    self.error_message, code="invalid_interface", params={"value": unit}
                )

        if value is None and not self.null:
            raise exceptions.ValidationError(self.error_messages["null"], code="null")

        if not self.blank and not value:
            raise exceptions.ValidationError(self.error_messages["blank"], code="blank")

    def formfield(self, **kwargs):
        """Declare the above CompositeDurationFormField as form field for this model field."""
        kwargs = {
            **kwargs,
            "form_class": CompositeDurationFormField,
            "widget": CompositeDurationWidget(
                choices=tuple(
                    (name, strings[0]) for name, strings in self.time_units.items()
                ),
                default_unit=self.default_unit,
            ),
        }
        return super().formfield(**kwargs)

    def contribute_to_class(self, cls, name, private_only=False):
        """
        Add a method to the model using this field to enable the common `get_FIELD_display`
        pattern to display the human readable version of a field based on choices.

        We choose to display a sentence of the form: "5 days".
        """
        super().contribute_to_class(cls, name, private_only=private_only)
        choices = self.time_units

        def func(self, *_args):
            """
            we add `*args` because this method is used in a "render_model" template tag
            and it passes a "request" argument when calling the method.
            For more information, see:
            http://docs.django-cms.org/en/latest/how_to/frontend_models.html
            """
            value = getattr(self, name)
            if not value:
                return ""

            duration, unit = value
            duration = int(duration)
            count_index = 1 if duration > 1 else 0
            return "{duration:d} {unit!s}".format(
                duration=duration, unit=choices[unit][count_index]
            )

        setattr(cls, "get_%s_display" % self.name, func)
