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

        # Every available language is present
        for item in ["en", "fr"]:
            self.assertContains(response, page.get_absolute_url(language=item))

        self.assertContains(response, "en, currently in English")
        self.assertContains(response, "fr, switch to French")

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

        # English should not be in the language chooser as it is not public
        self.assertContains(response, page.get_absolute_url(language="fr"))
        self.assertContains(response, page.get_absolute_url(language="de"))
        self.assertNotContains(response, page.get_absolute_url(language="en"))

        self.assertContains(response, "fr, actuellement en Français")
        self.assertContains(response, "de, basculer vers Allemand")
        self.assertNotContains(response, "en, basculer vers Anglais")

    def test_language_chooser_available_language_with_translated_page(self):
        """
        Menu should contain every available language, current language item
        should be marked with a distinct class name
        """
        content = {"en": "Language menu test", "fr": "Test du menu de langues"}
        page = create_i18n_page(
            content, published=True, template="richie/single_column.html"
        )
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)

        # Every available language is present
        for item in ["en", "fr"]:
            self.assertContains(response, page.get_absolute_url(language=item))

        # Current language item is marked active according to user language
        # choice (from i18n url prefix)
        self.assertContains(
            response,
            (
                '<li class="languages-menu__item '
                'languages-menu__item--en">'
            ),
        )
        self.assertContains(response, "en, basculer vers Anglais")
        self.assertContains(
            response,
            (
                '<li class="languages-menu__item '
                "languages-menu__item--fr "
                'languages-menu__item--active">'
            ),
        )
        self.assertContains(response, "fr, actuellement en Français")
