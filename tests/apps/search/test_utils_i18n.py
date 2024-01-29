"""
Test for our internationalization utilities
"""

from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.search.utils.i18n import get_best_field_language


class I18nUtilsTestCase(TestCase):
    """
    Make sure our get_best_field_language returns the best possible text content depending
    on what is available in our multilingual field
    """

    @override_settings(LANGUAGES=(("en", None), ("fr", None)))
    def test_utils_i18n_get_best_field_language(self):
        """
        Use the best language as requested by the consumer, if available
        """
        field = {"en": "the content", "es": "el contenido", "fr": "le contenu"}
        self.assertEqual(get_best_field_language(field, "es"), "el contenido")

    @override_settings(LANGUAGES=(("en", None), ("fr", None)))
    def test_utils_i18n_get_best_field_language_default_1(self):
        """
        Defaults to settings.LANGUAGES in order if the best language is not available
        """
        field = {"en": "the content", "fr": "le contenu"}
        self.assertEqual(get_best_field_language(field, "es"), "the content")

    @override_settings(LANGUAGES=(("en", None), ("fr", None)))
    def test_utils_i18n_get_best_field_language_default_2(self):
        """
        Defaults to settings.LANGUAGES in order if the best language is not available
        """
        field = {"fr": "le contenu"}
        self.assertEqual(get_best_field_language(field, "es"), "le contenu")
