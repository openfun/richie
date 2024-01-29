"""
Validators tests
"""

from django.core.exceptions import ValidationError
from django.test import TestCase

from richie.plugins.simple_text_ckeditor.validators import HTMLMaxLengthValidator


class SimpleTextValidatorTestCase(TestCase):
    """Tests for the SimpleText validator"""

    def test_validators_simpletext_valid(self):
        """A text with just the right number of characters should validate."""
        dirty_text = "<div>株ＫＡ&nbsp;&ecirc;  <b>&eacute;</b></div>"
        # => The text taken into account for the count should be: "株KA ê  é" (8 characters)
        with self.assertRaises(ValidationError):
            HTMLMaxLengthValidator(7)(dirty_text)

        self.assertIsNone(HTMLMaxLengthValidator(8)(dirty_text))
