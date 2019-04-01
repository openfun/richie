"""
Unit tests for the template tags of the search app.
"""
from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.search.templatetags.search_tags import react_locale


class ReactLocaleSearchTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `react_locale` template filter.
    """

    @override_settings(REACT_LOCALES=["en_US", "fr_CA", "fr_FR", "es_ES"])
    def test_templatetags_search_tags_react_locale_canada_first(self):
        """
        Languages should return the first matching React locale (Canada comes
        before France).
        """
        # Full languages
        self.assertEqual(react_locale("fr-FR"), "fr_FR")
        self.assertEqual(react_locale("fr-CA"), "fr_CA")

        # Simple languages
        self.assertEqual(react_locale("en"), "en_US")
        self.assertEqual(react_locale("es"), "es_ES")
        self.assertEqual(react_locale("fr"), "fr_CA")

    @override_settings(REACT_LOCALES=["en_US", "fr_FR", "fr_CA", "es_ES"])
    def test_templatetags_search_tags_react_locale_france_first(self):
        """
        Languages should return the first matching React locale (France comes
        before Canada).
        """
        self.assertEqual(react_locale("en"), "en_US")
        self.assertEqual(react_locale("es"), "es_ES")
        self.assertEqual(react_locale("fr"), "fr_FR")

    @override_settings(REACT_LOCALES=["en_US", "fr_CA", "fr_FR", "es_ES"])
    def test_templatetags_search_tags_react_locale_absent(self):
        """
        An ImproperlyConfigured exception should be raised if the language does not
        correspond to any React locale.
        """
        with self.assertRaises(ImproperlyConfigured):
            react_locale("fr-BE")

        with self.assertRaises(ImproperlyConfigured):
            react_locale("it")
