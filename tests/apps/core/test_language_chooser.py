# -*- coding: utf-8 -*-
"""
Unit tests for the language_chooser menu
"""
from django.test.utils import override_settings

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


class LanguageChooserTests(CMSTestCase):
    """Test the language chooser menu for available languages"""

    def test_language_chooser_available_language_public(self):
        """
        Menu should always contain every available language from settings,
        no matter if the page has a translation or not
        """
        page = create_page(
            language="en",
            menu_title="Language menu test",
            title="Language menu test",
            slug="language-test-page",
            template="richie/single_column.html",
            published=True,
        )

        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertContains(response, '"currentLanguage": "en"')
        self.assertContains(response, '"code": "en"')
        self.assertContains(response, '"name": "English"')
        self.assertContains(response, '"url": "/en/language-test-page/"')
        self.assertContains(response, '"code": "fr"')
        self.assertContains(response, '"name": "Français"')
        self.assertContains(response, '"url": "/fr/language-test-page/"')

    @override_settings(
        LANGUAGES=(("en", "English"), ("fr", "Français"), ("de", "Deutsch")),
        CMS_LANGUAGES={
            1: [
                {"code": "fr", "hide_untranslated": False, "name": "Français"},
                {"code": "de", "hide_untranslated": False, "name": "Deutsch"},
                {
                    "public": False,
                    "code": "en",
                    "hide_untranslated": False,
                    "name": "English",
                },
            ]
        },
    )
    def test_language_chooser_available_language_not_public(self):
        """
        Languages that are marked as not public should only be visible to staff users.
        """
        content = {
            "de": "Sprachmenü test",
            "en": "Language menu test",
            "fr": "Test du menu de langues",
        }
        page = create_i18n_page(
            content, published=True, template="richie/single_column.html"
        )
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)

        self.assertContains(response, '"currentLanguage": "fr"')
        self.assertContains(response, '"code": "fr"')
        self.assertContains(response, '"name": "Français"')
        self.assertContains(response, '"url": "/fr/test-du-menu-de-langues/"')
        self.assertContains(response, '"code": "de"')
        self.assertContains(response, '"name": "Deutsch"')
        self.assertContains(response, '"url": "/de/sprachmenu-test/"')

        self.assertNotContains(response, '"code": "en"')
        self.assertNotContains(response, '"name": "English"')
        self.assertNotContains(response, '"url": "/en/language-test-page/"')
