"""A multi select field where the array of values is stored as a comma separated string."""
from django.core import checks, exceptions, validators
from django.db import models
from django.forms import MultipleChoiceField, widgets
from django.utils.text import capfirst
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext_lazy


def to_sentence(elements):
    """
    Arguments:
    -----------
    elements (Iterable[string]): an iterable yielding the elements that we want
        to arrange in a sentence.

    Returns:
    --------
    string: the list of elements of the iterable in the form of a sentence:
        ["French"] > "French"
        ["French", "English"] > "French and english"
        ["French", "English", "german"] > "French, english and german"

    """
    if len(elements) > 2:
        return (
            _("{:s} and {:s}").format(
                ", ".join(map(str, elements[:-1])), str(elements[-1])
            )
        ).lower()
    return (_(" and ").join(map(str, elements))).lower()


class MaxChoicesValidator(validators.MaxLengthValidator):
    """A max length validator for the number of choices in a multiselect value."""

    message = _("You can only select up to %(limit_value)d choices.")
    code = "max_choices"


class MultiSelectFormField(MultipleChoiceField):
    """
    The Formfield for our multiselect field is based on the SelectMultiple widget and
    should validate its `max_choices` parameter.
    """

    widget = widgets.SelectMultiple

    def __init__(self, *args, **kwargs):
        """
        Set validators for the field's maximum number of choices.
        """
        self.max_choices = kwargs.pop("max_choices", None)
        super().__init__(*args, **kwargs)

        if self.max_choices is not None:
            self.validators.append(MaxChoicesValidator(self.max_choices))


class MultiSelectField(models.CharField):
    """
    A custom database field to store a list of string values.
    This is an alternative to Django's ArrayField that is compatible with Mysql.
    The array of values is stored in a comma separated string.
    """

    description = _("Multi select field (up to %(max_choices)s choices)")

    error_message = ngettext_lazy(
        "Value %(value)s is not a valid choice.",
        "Values %(value)s are not valid choices.",
        "number",
    )

    def __init__(self, *args, **kwargs):
        """
        Add the `max_choices` parameter and make it required.
        """
        self.max_choices = kwargs.pop("max_choices", None)
        super().__init__(*args, **kwargs)
        self.max_length = kwargs.pop("max_length", None)
        # We only need to validate `max_choices` since its coherence with
        # `max_length` is ensured by below's field checks.
        self.validators.append(MaxChoicesValidator(self.max_choices))

    def deconstruct(self):
        """Return enough information to recreate the field as a 4-tuple."""
        name, path, args, kwargs = super().deconstruct()
        kwargs["max_choices"] = self.max_choices
        return name, path, args, kwargs

    def _check_choices(self):
        """Make the `choices` parameter required."""
        if not self.choices:
            return [
                checks.Error(
                    "MultiSelectFields must define a 'choices' attribute.",
                    obj=self,
                    id="fields.E1001",
                )
            ]
        return super()._check_choices()

    def _check_max_choices_attribute(self):
        """Check that max_choices is well configured."""
        if self.max_choices is None:
            return [
                checks.Error(
                    "MultiSelectFields must define a 'max_choices' attribute.",
                    obj=self,
                    id="fields.E1002",
                )
            ]
        if (
            not isinstance(self.max_choices, int)
            or isinstance(self.max_choices, bool)
            or self.max_choices <= 0
        ):
            return [
                checks.Error(
                    "'max_choices' must be a positive integer.",
                    obj=self,
                    id="fields.E1003",
                )
            ]
        # Make sure max_choices is coherent with max_length
        # Calculate the maximum length this number of choices can represent when stored
        # as a comma separated string:
        ordered_choices = sorted([c[0] for c in self.choices], key=lambda c: -len(c))
        max_length = len(",".join(ordered_choices[: self.max_choices]))
        if max_length > (self.max_length or 0):
            error_message = _(
                "Storing {:d} choices could require storing a CharField of up to {:d} "
                "characters. Please reduce 'max_choices' or increase 'max_length'."
            ).format(self.max_choices, max_length)
            return [checks.Error(error_message, obj=self, id="fields.E1003")]

        return []

    def check(self, **kwargs):
        """Add checks on max_choices to the field's checks."""
        res = [*super().check(**kwargs), *self._check_max_choices_attribute()]
        return res

    @staticmethod
    def from_db_value(value, *_args):
        """Convert a database value to a list value."""
        if not value:
            return None if value is None else []
        return list([v.strip() for v in value.split(",")])

    def to_python(self, value):
        """Convert a string value to a list value. Used for deserialization and in clean forms."""
        if isinstance(value, list):
            return value
        if not value:
            return None if value is None else []
        return list([v.strip() for v in value.split(",")])

    def get_prep_value(self, value):
        """
        Transform the list value to a concatenation of comma separated strings.

        Arguments:
        ----------
        value (List[string]): a list of strings representing the Python representation
            of multiple Char values.

        Returns:
        --------
        string:
            [] > "" (to differentiate from the null value)
            ["en"] > "en"
            ["en", "fr"] > "en,fr"

        """
        if value is None:
            return None
        return ",".join(value)

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

        if self.choices and value:
            # Build a set of possible choices
            choices = set()
            for option_key, option_value in self.choices:
                if isinstance(option_value, (list, tuple)):
                    # This is an optgroup, so look inside the group for
                    # options.
                    for optgroup_key, _optgroup_value in option_value:
                        choices.add(optgroup_key)
                else:
                    choices.add(option_key)

            # Search each value in this set
            invalid_choices = [v for v in value if v not in choices]
            if invalid_choices:
                raise exceptions.ValidationError(
                    self.error_message,
                    code="invalid_choices",
                    params={
                        "number": len(invalid_choices),
                        "value": to_sentence(invalid_choices),
                    },
                )

        if value is None and not self.null:
            raise exceptions.ValidationError(self.error_messages["null"], code="null")

        if not self.blank and not value:
            raise exceptions.ValidationError(self.error_messages["blank"], code="blank")

    def formfield(self, **kwargs):
        """Declare the above MultiSelectFormField as form field for this model field."""
        # don't call super, as that overrides default widget if it has choices
        defaults = {
            "required": not self.blank,
            "label": capfirst(self.verbose_name),
            "help_text": self.help_text,
            "choices": self.choices,
            "max_choices": self.max_choices,
        }
        if self.has_default():
            defaults["initial"] = self.get_default()
        defaults.update(kwargs)
        return MultiSelectFormField(**defaults)

    def contribute_to_class(self, cls, name, private_only=False):
        """
        Add a method to the model using this field to enable the common `get_FIELD_display`
        pattern to display the human readable version of a field based on choices.

        We choose to display a sentence of the form: "French, English and German".
        """
        super().contribute_to_class(cls, name, private_only=private_only)
        if self.choices:
            choicedict = dict(self.choices)

            def func(self, *_args):
                """
                we add `*args` because this method is used in a "render_model" template tag
                and it passes a "request" argument when calling the method.
                For more information, see:
                http://docs.django-cms.org/en/latest/how_to/frontend_models.html
                """
                return capfirst(
                    to_sentence(
                        [choicedict.get(value, value) for value in getattr(self, name)]
                    )
                )

            setattr(cls, "get_%s_display" % self.name, func)
