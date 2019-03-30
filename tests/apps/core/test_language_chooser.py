# -*- coding: utf-8 -*-
"""
Unit tests for the language_chooser menu
"""
from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


class LanguageChooserTests(CMSTestCase):
    """Test the language chooser menu for available languages"""

    def test_language_chooser_available_language(self):
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
                '<li class="topbar__menu__list__item '
                "topbar__menu__list__item--language "
                'topbar__menu__list__item--en">'
            ),
        )
        self.assertContains(
            response,
            (
                '<li class="topbar__menu__list__item '
                "topbar__menu__list__item--language "
                "topbar__menu__list__item--fr "
                'topbar__menu__list__item--active">'
            ),
        )
