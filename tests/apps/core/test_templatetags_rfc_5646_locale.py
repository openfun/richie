"""
Unit tests for the template tags of the search app.
"""

from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.core.templatetags.rfc_5646_locale import rfc_5646_locale


class ReactLocaleSearchTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `rfc_5646_locale` template filter.
    """

    @override_settings(RFC_5646_LOCALES=["en-US", "fr-CA", "fr-FR", "es-ES"])
    def test_templatetags_search_tags_rfc_5646_locale_canada_first(self):
        """
        Languages should return the first matching BCP47/RFC5646 locale (Canada comes
        before France).
        """
        # Full ISO 15897 locales incl. region
        self.assertEqual(rfc_5646_locale("fr_FR"), "fr-FR")
        self.assertEqual(rfc_5646_locale("fr_CA"), "fr-CA")

        # Django style dash-separated lowercase language-region pairs
        self.assertEqual(rfc_5646_locale("en-us"), "en-US")
        self.assertEqual(rfc_5646_locale("es-es"), "es-ES")

        # Simple languages
        self.assertEqual(rfc_5646_locale("en"), "en-US")
        self.assertEqual(rfc_5646_locale("es"), "es-ES")
        self.assertEqual(rfc_5646_locale("fr"), "fr-CA")

    @override_settings(RFC_5646_LOCALES=["en-US", "fr-FR", "fr-CA", "es-ES"])
    def test_templatetags_search_tags_rfc_5646_locale_france_first(self):
        """
        Languages should return the first matching BCP47/RFC5646 locale (France comes
        before Canada).
        """
        self.assertEqual(rfc_5646_locale("en"), "en-US")
        self.assertEqual(rfc_5646_locale("es"), "es-ES")
        self.assertEqual(rfc_5646_locale("fr"), "fr-FR")

    @override_settings(RFC_5646_LOCALES=["en-US", "fr-CA", "fr-FR", "es-ES"])
    def test_templatetags_search_tags_rfc_5646_locale_absent(self):
        """
        An ImproperlyConfigured exception should be raised if the language does not
        correspond to any BCP47/RFC5646 locale.
        """
        with self.assertRaises(ImproperlyConfigured):
            rfc_5646_locale("fr_BE")

        with self.assertRaises(ImproperlyConfigured):
            rfc_5646_locale("it")
