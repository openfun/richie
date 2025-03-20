# -*- coding: utf-8 -*-
"""
Unit tests for the language_chooser menu
"""
from django.test.utils import override_settings
from django.utils.translation import gettext_lazy as _

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


class LanguageChooserTests(CMSTestCase):
    """Test the language chooser menu for available languages"""

    @override_settings(
        LANGUAGES=(
            ("en", _("English")),
            ("fr", _("French")),
            ("pt", _("Portuguese")),
            ("pt-br", _("Brazilian Portuguese")),
            ("es", _("Spanish")),
            ("ru", _("Russian")),
            ("vi", _("Vietnamese")),
            ("ar", _("Arabic (Saudi Arabia)")),
            ("ko", _("Korean")),
        ),
        CMS_LANGUAGES={
            1: [
                {"code": "en", "hide_untranslated": False, "name": "English"},
                {"code": "fr", "hide_untranslated": False, "name": "Français"},
                {"code": "pt", "hide_untranslated": False, "name": "Português"},
                {
                    "code": "pt-br",
                    "hide_untranslated": False,
                    "name": "Português Brasileiro",
                },
                {"code": "es", "hide_untranslated": False, "name": "Español"},
                {"code": "ru", "hide_untranslated": False, "name": "Русский"},
                {"code": "vi", "hide_untranslated": False, "name": "Tiếng Việt Nam"},
                {
                    "code": "ar",
                    "hide_untranslated": False,
                    "name": "Arabic (Saudi Arabia)",
                },
                {"code": "ko", "hide_untranslated": False, "name": "한국어"},
            ]
        },
    )
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

        self.assertContains(response, '"code": "pt"')
        self.assertContains(response, '"name": "Português"')
        self.assertContains(response, '"url": "/pt/language-test-page/"')

        self.assertContains(response, '"code": "pt-br"')
        self.assertContains(response, '"name": "Português Brasileiro"')
        self.assertContains(response, '"url": "/pt-br/language-test-page/"')

        self.assertContains(response, '"code": "fr"')
        self.assertContains(response, '"name": "Français"')
        self.assertContains(response, '"url": "/fr/language-test-page/"')

        self.assertContains(response, '"code": "es"')
        self.assertContains(response, '"name": "Español"')
        self.assertContains(response, '"url": "/es/language-test-page/"')

        self.assertContains(response, '"code": "ru"')
        self.assertContains(response, '"name": "Русский"')
        self.assertContains(response, '"url": "/ru/language-test-page/"')

        self.assertContains(response, '"code": "vi"')
        self.assertContains(response, '"name": "Tiếng Việt Nam"')
        self.assertContains(response, '"url": "/vi/language-test-page/"')

        self.assertContains(response, '"code": "ar"')
        self.assertContains(response, '"name": "Arabic (Saudi Arabia)"')
        self.assertContains(response, '"url": "/ar/language-test-page/"')

        self.assertContains(response, '"code": "ko"')
        self.assertContains(response, '"name": "한국어"')
        self.assertContains(response, '"url": "/ko/language-test-page/"')

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
