"""
A custom field that defines efforts as a number of pre-defined time units per reference time unit
(e.g 2 hours/day, 5 hours/week or 3 days/months).
"""
from django import forms
from django.core import checks, exceptions
from django.db import models
from django.db.utils import DataError
from django.forms import widgets
from django.utils.translation import gettext_lazy as _


class EffortWidget(widgets.MultiWidget):
    """
    A widget that splits the input of an effort into one integer input box and two select boxes.
    """

    template_name = "richie/forms/widgets/composite_widget.html"

    def __init__(
        self,
        attrs=None,
        choices=(),
        default_effort_unit=None,
        default_reference_unit=None,
    ):
        """
        Split the field in 3 widgets:
        - the first widget is a positive integer input,
        - the second widget is a select box to choose a pre-defined time unit (minutes, hours,
          days, weeks or months),
        - the third widget is a select box to choose the pre-defined time unit of reference.

        e.g: 3 hours/day is split in: 3 (integer input) | hour (select) | day (select)
        """
        self.default_effort_unit = default_effort_unit
        self.default_reference_unit = default_reference_unit
        super().__init__(
            (
                widgets.NumberInput({**(attrs or {}), "min": 0}),
                # Remove the last choice: it can never be chosen as it must be strictly smaller
                # than the reference time unit
                widgets.Select(attrs, choices[:-1]),
                # Remove the first choice: it can never be chosen as it must be strictly greater
                # than the effort time unit
                widgets.Select(attrs, choices[1:]),
            )
        )

    def decompress(self, value):
        """
        Return the raw value as it is already a triplet [duration, unit, reference].
        In the absence of a value, pre-configure the two time unit select widgets as defined
        in the field.
        """
        return value or ["", self.default_effort_unit, self.default_reference_unit]


class EffortFormField(forms.CharField):
    """
    The composite duration field is saved in database as a charfield but represented in Python
    by a triplet [duration,unit,reference]. We should not force its value to str.
    """

    def to_python(self, value):
        """Return the raw value to avoid the charfield behavior that forces the value to str."""
        return value


class EffortField(models.CharField):
    """
    A custom charfield to store an effort in database as an integer and 2 time unit choices.
    """

    description = _("Define an effort")

    error_message = _("%(value)s is not a valid choice for a time unit.")

    def __init__(self, *args, **kwargs):
        """
        Record the three additional field attributes `time_units`, `default_effort_unit` and
        `default_reference_unit` in the instance.
        """
        self.time_units = kwargs.pop("time_units", None)
        self.default_effort_unit = kwargs.pop("default_effort_unit", None)
        self.default_reference_unit = kwargs.pop("default_reference_unit", None)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        """Return enough information to recreate the field as a 4-tuple."""
        name, path, args, kwargs = super().deconstruct()
        kwargs["time_units"] = self.time_units
        kwargs["default_effort_unit"] = self.default_effort_unit
        kwargs["default_reference_unit"] = self.default_reference_unit
        return name, path, args, kwargs

    def _check_time_units_attribute(self):
        """Check that `time_units` is well configured."""
        if self.time_units is None:
            return [
                checks.Error(
                    "Effort fields must define a 'time_units' attribute.",
                    obj=self,
                    id="fields.E1010",
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
                    id="fields.E1011",
                )
            ]

        return []

    def _check_default_effort_unit_attribute(self):
        """Check that `default_effort_unit` is well configured."""
        if self.default_effort_unit and self.default_effort_unit not in self.time_units:
            return [
                checks.Error(
                    "'{:s}' is not a valid time unit.".format(self.default_effort_unit),
                    obj=self,
                    id="fields.E1012",
                )
            ]

        return []

    def _check_default_reference_unit_attribute(self):
        """Check that `default_reference_unit` is well configured."""
        if (
            self.default_reference_unit
            and self.default_reference_unit not in self.time_units
        ):
            return [
                checks.Error(
                    "'{:s}' is not a valid time unit.".format(
                        self.default_reference_unit
                    ),
                    obj=self,
                    id="fields.E1013",
                )
            ]

        return []

    def check(self, **kwargs):
        """Add checks on time units to the field's checks."""
        return (
            super().check(**kwargs)
            + self._check_time_units_attribute()
            + self._check_default_effort_unit_attribute()
            + self._check_default_reference_unit_attribute()
        )

    @staticmethod
    def from_db_value(value, *_args):
        """Convert a database value to a list value."""
        if not value:
            return None

        try:
            duration, unit, reference = value.split("|")
        except ValueError as error:
            raise DataError(
                "Value in database should be of the form '{duration:d}|{unit:s}|{reference:s}'"
            ) from error

        if not duration:
            return None

        return int(duration), unit, reference

    def to_python(self, value):
        """Convert a string value to a list value. Used for deserialization and in clean forms."""
        if isinstance(value, (list, tuple)):
            return value

        if not value:
            return None

        if isinstance(value, str):
            try:
                duration, unit, reference = value.split("|")
            except ValueError as error:
                raise DataError(
                    "Value in database should be of the form '{duration:d}|{unit:s}|{reference:s}'"
                ) from error

            return int(duration.strip()), unit.strip(), reference.strip()

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
            [0, "day", "week"] > "0|day|week"
            [5, "day", "week"] > "5|day|week"

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

            if size != 3:
                raise exceptions.ValidationError(
                    _(
                        "An effort should be a triplet: number, time unit and reference unit."
                    ),
                    code="invalid_format",
                )

            duration, unit, reference = value

            if duration:
                # Check that the duration is an integer
                try:
                    duration = int(duration)
                except ValueError as error:
                    raise exceptions.ValidationError(
                        _("An effort should be a round number of time units."),
                        code="invalid_effort",
                    ) from error

                # Check that the duration is positive
                if duration <= 0:
                    raise exceptions.ValidationError(
                        _("An effort should be positive."), code="negative_effort"
                    )

            choices = list(dict(self.time_units))

            # Search the time unit in this set
            if unit not in choices:
                raise exceptions.ValidationError(
                    self.error_message, code="invalid_interface", params={"value": unit}
                )

            # Search the reference time unit in this set
            if reference not in choices:
                raise exceptions.ValidationError(
                    self.error_message,
                    code="invalid_reference",
                    params={"value": reference},
                )

            if choices.index(unit) >= choices.index(reference):
                raise exceptions.ValidationError(
                    _(
                        "The effort time unit should be shorter than the reference unit."
                    ),
                    code="unit_order",
                )

        if value is None and not self.null:
            raise exceptions.ValidationError(self.error_messages["null"], code="null")

        if not self.blank and not value:
            raise exceptions.ValidationError(self.error_messages["blank"], code="blank")

    def formfield(self, **kwargs):
        """Declare the above EffortFormField as form field for this model field."""
        kwargs = {
            **kwargs,
            "form_class": EffortFormField,
            "widget": EffortWidget(
                choices=tuple(
                    (name, strings[0]) for name, strings in self.time_units.items()
                ),
                default_effort_unit=self.default_effort_unit,
                default_reference_unit=self.default_reference_unit,
            ),
        }
        return super().formfield(**kwargs)

    def contribute_to_class(self, cls, name, private_only=False):
        """
        Add a method to the model using this field to enable the common `get_FIELD_display`
        pattern to display the human readable version of a field based on choices.

        We choose to display a sentence of the form: "5 days/week".
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
            if value:
                duration, unit, reference = value
                duration = int(duration)
                count_index = 1 if duration > 1 else 0
                return "{duration:d} {unit!s}/{reference!s}".format(
                    duration=duration,
                    unit=choices[unit][count_index],
                    reference=choices[reference][0],
                )
            return ""

        setattr(cls, "get_%s_display" % self.name, func)
