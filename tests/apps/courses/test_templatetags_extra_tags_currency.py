"""
Unit tests for the `currency` template filter.
"""

from django.test import TestCase, override_settings
from django.utils import translation

from richie.apps.courses.templatetags.extra_tags import currency


class CurrencyFilterTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `currency` template filter.
    """

    def test_templatetags_extra_tags_currency_with_valid_inputs(self):
        """
        The currency filter should properly format numbers according to the current locale.
        """
        with translation.override("en"):
            self.assertEqual(currency(1234.5, "EUR"), "€1,234.50")
            self.assertEqual(currency(1234.5, "USD"), "$1,234.50")
            self.assertEqual(currency(1234.5, "GBP"), "£1,234.50")

        with translation.override("fr"):
            self.assertEqual(currency(1234.5, "EUR"), "1\u202f234,50\u00a0€")
            self.assertEqual(currency(1234.5, "USD"), "1\u202f234,50\u00a0$US")
            self.assertEqual(currency(1234.5, "GBP"), "1\u202f234,50\u00a0£GB")

    def test_templatetags_extra_tags_currency_with_string_number(self):
        """
        The currency filter should handle string numbers correctly.
        """
        with translation.override("en"):
            self.assertEqual(currency("1234.5", "EUR"), "€1,234.50")
            self.assertEqual(currency("1234", "EUR"), "€1,234.00")

    def test_templatetags_extra_tags_currency_with_invalid_inputs(self):
        """
        The currency filter should return the input value when given invalid inputs.
        """
        invalid_inputs = [
            None,
            "",
            "invalid",
            "12.34.56",
            [],
            {},
        ]

        for invalid_input in invalid_inputs:
            self.assertEqual(currency(invalid_input, "EUR"), invalid_input)

    @override_settings(LANGUAGE_CODE="en")
    def test_templatetags_extra_tags_currency_with_no_active_language(self):
        """
        The currency filter should fall back to settings.LANGUAGE_CODE when no language
        is active.
        """
        with translation.override(None):
            self.assertEqual(currency(1234.5, "EUR"), "€1,234.50")
