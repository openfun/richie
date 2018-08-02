"""
Test suite for all helpers in the `core` application
"""
from unittest import mock

from django.test.utils import override_settings

from cms.api import Page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page


class CreateI18nPageTestCase(CMSTestCase):
    """Test suite for the `create_i18n_page` helper"""

    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_no_arguments(self, mock_page, mock_title):
        """
        It should be possible to create a multilingual page without any arguments. A page is
        created with a random title in the default language from settings and with the default
        template.
        The page creation is delegated to the DjangoCMS "create_page" helper.
        """
        create_i18n_page()
        self.assertEqual(mock_page.call_count, 1)
        self.assertFalse(mock_title.called)
        self.assertEqual(mock_page.call_args[1]["language"], "en")
        self.assertEqual(mock_page.call_args[1]["template"], "richie/fullwidth.html")

    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_from_invalid_title(self, mock_page, mock_title):
        """
        Trying to create a multilingual page from an invalid title format should fail.
        to differentiate each language
        """
        for title in [["a"], {"a"}, 3]:
            with self.assertRaises(ValueError):
                create_i18n_page(title)

        self.assertFalse(mock_page.called)
        self.assertFalse(mock_title.called)

    # pylint: disable=no-self-use
    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr")))
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_from_string(self, mock_page, mock_title):
        """
        It should be possible to create a multilingual page from a string. The string is marked
        to differentiate each language
        """
        page = create_i18n_page("lorem ipsum", languages=["fr", "en"])
        mock_page.assert_called_once_with(
            language="fr",
            menu_title="lorem ipsum fr",
            slug="lorem-ipsum-fr",
            template="richie/fullwidth.html",
            title="lorem ipsum fr",
        )
        mock_title.assert_called_once_with(
            language="en",
            menu_title="lorem ipsum en",
            page=page,
            slug="lorem-ipsum-en",
            title="lorem ipsum en",
        )

    # pylint: disable=no-self-use
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_from_dict(self, mock_page, mock_title):
        """
        It should be possible to create a multilingual page from a dictionary of titles.
        The page creation is delegated to the DjangoCMS "create_page" helper.
        """
        i18n_titles = {"fr": "Titre français", "en": "English title"}
        page = create_i18n_page(i18n_titles)
        mock_page.assert_called_once_with(
            language="fr",
            menu_title="Titre français",
            slug="titre-francais",
            template="richie/fullwidth.html",
            title="Titre français",
        )
        mock_title.assert_called_once_with(
            language="en",
            menu_title="English title",
            page=page,
            slug="english-title",
            title="English title",
        )

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")))
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_from_dict_languages_invalid(
        self, mock_page, mock_title
    ):
        """
        Trying to create a multilingual page from a dict with languages should fail if they
        don't match with the list of languages passed.
        """
        i18n_titles = {"fr": "Titre français", "de": "Deutches Titel"}
        with self.assertRaises(AssertionError):
            create_i18n_page(i18n_titles, languages=["en", "fr"])

        self.assertFalse(mock_page.called)
        self.assertFalse(mock_title.called)

        create_i18n_page(i18n_titles, languages=["de", "fr"])
        self.assertEqual(mock_page.call_count, 1)
        self.assertEqual(mock_title.call_count, 1)
        self.assertEqual(mock_page.call_args[1]["language"], "de")
        self.assertEqual(mock_title.call_args[1]["language"], "fr")

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr")))
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_from_dict_languages_limit(
        self, mock_page, mock_title
    ):
        """
        It should be possible to limit the subset of languages in which the page is created.
        """
        i18n_titles = {"fr": "Titre français", "en": "English title"}
        create_i18n_page(i18n_titles, languages=["fr"])

        self.assertEqual(mock_page.call_count, 1)
        self.assertFalse(mock_title.called)
        self.assertEqual(mock_page.call_args[1]["language"], "fr")

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr")))
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_from_languages(self, mock_page, mock_title):
        """
        It should be possible to create a multilingual page from a list of existing languages.
        The title is generated with Faker in each language.
        The page creation is delegated to the DjangoCMS "create_page" helper.
        """
        create_i18n_page(languages=["en", "fr"])
        self.assertEqual(mock_page.call_count, 1)
        self.assertEqual(mock_title.call_count, 1)
        self.assertEqual(mock_page.call_args[1]["language"], "en")
        self.assertEqual(mock_title.call_args[1]["language"], "fr")

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr")))
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_utils_create_i18n_page_from_languages_invalid(self, mock_page, mock_title):
        """
        Trying to create a multilingual page for languages that don't exist should fail.
        """
        with self.assertRaises(AssertionError):
            create_i18n_page(languages=["en", "de"])

        self.assertFalse(mock_page.called)
        self.assertFalse(mock_title.called)

    @mock.patch.object(Page, "set_as_homepage")
    def test_utils_create_i18n_page_homepage_not(self, mock_homepage):
        """
        Check that `create_i18n_page` does not set the created page as homepage if it is not
        requested.
        Don't mock `create_page` so we can easily check the call to set it as homepage
        """
        create_i18n_page()
        self.assertFalse(mock_homepage.called)

    @mock.patch.object(Page, "set_as_homepage")
    def test_utils_create_i18n_page_homepage(self, mock_homepage):
        """
        Check that `create_i18n_page` can set the created page as homepage
        Don't mock `create_page` so we can easily check the call to set it as homepage
        """
        create_i18n_page(is_homepage=True)
        self.assertTrue(mock_homepage.called)

    @mock.patch.object(Page, "publish")
    def test_utils_create_i18n_page_published_not(self, mock_publish):
        """
        Check that `create_i18n_page` does not publish the created page if it is not requested.
        Don't mock `create_page` so we can easily check the call to publish.
        """
        create_i18n_page()
        self.assertFalse(mock_publish.called)

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr")))
    @mock.patch.object(Page, "publish")
    def test_utils_create_i18n_page_published(self, mock_publish):
        """
        Check that `create_i18n_page` publishes the created page in all languages when requested.
        Don't mock `create_page` so we can easily check the call to publish.
        """
        create_i18n_page(published=True, languages=["en", "fr"])
        self.assertEqual([c[0][0] for c in mock_publish.call_args_list], ["en", "fr"])
