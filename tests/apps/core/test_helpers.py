"""
Test suite for all helpers in the `core` application
"""
import random
from unittest import mock

from django.contrib.auth.models import Permission
from django.test import TestCase
from django.test.utils import override_settings

from cms.api import Page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PermissionFactory
from richie.apps.core.helpers import create_i18n_page, get_permissions


class GetPermissionsHelpersTestCase(TestCase):
    """Test suite for the `get_permissions` helper."""

    def test_helpers_get_permissions(self):
        """
        Given an iterable of permission names, it should return the list of corresponding
        permission objects. This should be done in 1 query.
        """
        PermissionFactory.reset_sequence()
        permissions = PermissionFactory.create_batch(5)
        sample_permissions = random.sample(permissions, 3)
        names = [
            f"{permission.content_type.app_label:s}.{permission.codename:s}"
            for permission in sample_permissions
        ]
        with self.assertNumQueries(1):
            self.assertEqual(set(get_permissions(names)), set(sample_permissions))

    def test_helpers_get_permissions_unknown(self):
        """Trying to retrieve a permission that does not exist should raise an exception."""
        with self.assertRaises(Permission.DoesNotExist) as context:
            get_permissions(["unknown.unknown"])

        self.assertEqual(
            str(context.exception),
            "Some permission names were not found: unknown.unknown",
        )

    def test_helpers_get_permissions_empty(self):
        """Trying to retrieve an empty list of permissions should return an empty query."""
        self.assertEqual(list(get_permissions([])), [])


class CreateI18nPageHelpersTestCase(CMSTestCase):
    """Test suite for the `create_i18n_page` helper."""

    def test_helpers_create_i18n_page_no_arguments(self):
        """The title argument is required to create i18n pages."""
        with self.assertRaises(TypeError) as context:
            # pylint: disable=no-value-for-parameter
            create_i18n_page()
        self.assertEqual(
            str(context.exception),
            "create_i18n_page() missing 1 required positional argument: 'title'",
        )

    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_helpers_create_i18n_page_from_invalid_title(self, mock_page, mock_title):
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
    def test_helpers_create_i18n_page_from_string(self, mock_page, mock_title):
        """
        It should be possible to create a multilingual page from a string.
        """
        page = create_i18n_page("lorem ipsum", languages=["fr", "en"])
        mock_page.assert_called_once_with(
            language="fr",
            slug="lorem-ipsum",
            template="richie/single_column.html",
            title="lorem ipsum",
        )
        mock_title.assert_called_once_with(
            language="en", page=page, slug="lorem-ipsum", title="lorem ipsum"
        )

    # pylint: disable=no-self-use
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_helpers_create_i18n_page_from_dict(self, mock_page, mock_title):
        """
        It should be possible to create a multilingual page from a dictionary of titles.
        The page creation is delegated to the DjangoCMS "create_page" helper.
        """
        i18n_titles = {"fr": "Titre français", "en": "English title"}
        page = create_i18n_page(i18n_titles)
        mock_page.assert_called_once_with(
            language="fr",
            slug="titre-francais",
            template="richie/single_column.html",
            title="Titre français",
        )
        mock_title.assert_called_once_with(
            language="en", page=page, slug="english-title", title="English title"
        )

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")))
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_helpers_create_i18n_page_from_dict_languages_invalid(
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
    def test_helpers_create_i18n_page_from_dict_languages_limit(
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
    def test_helpers_create_i18n_page_from_languages(self, mock_page, mock_title):
        """
        It should be possible to create a multilingual page from a list of existing languages.
        The page creation is delegated to the DjangoCMS "create_page" helper.
        """
        create_i18n_page("my title", languages=["en", "fr"])
        self.assertEqual(mock_page.call_count, 1)
        self.assertEqual(mock_title.call_count, 1)
        self.assertEqual(mock_page.call_args[1]["language"], "en")
        self.assertEqual(mock_title.call_args[1]["language"], "fr")

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr")))
    @mock.patch("richie.apps.core.helpers.create_title")
    @mock.patch("richie.apps.core.helpers.create_page")
    def test_helpers_create_i18n_page_from_languages_invalid(
        self, mock_page, mock_title
    ):
        """
        Trying to create a multilingual page for languages that don't exist should fail.
        """
        with self.assertRaises(AssertionError):
            create_i18n_page("my title", languages=["en", "de"])

        self.assertFalse(mock_page.called)
        self.assertFalse(mock_title.called)

    @mock.patch.object(Page, "set_as_homepage")
    def test_helpers_create_i18n_page_homepage_not(self, mock_homepage):
        """
        Check that `create_i18n_page` does not set the created page as homepage if it is not
        requested.
        Don't mock `create_page` so we can easily check the call to set it as homepage
        """
        create_i18n_page("my title")
        self.assertFalse(mock_homepage.called)

    @mock.patch.object(Page, "set_as_homepage")
    def test_helpers_create_i18n_page_homepage(self, mock_homepage):
        """
        Check that `create_i18n_page` can set the created page as homepage
        Don't mock `create_page` so we can easily check the call to set it as homepage
        """
        create_i18n_page("my title", is_homepage=True)
        self.assertTrue(mock_homepage.called)

    @mock.patch.object(Page, "publish")
    def test_helpers_create_i18n_page_published_not(self, mock_publish):
        """
        Check that `create_i18n_page` does not publish the created page if it is not requested.
        Don't mock `create_page` so we can easily check the call to publish.
        """
        create_i18n_page("my title")
        self.assertFalse(mock_publish.called)

    @override_settings(LANGUAGES=(("en", "en"), ("fr", "fr")))
    @mock.patch.object(Page, "publish")
    def test_helpers_create_i18n_page_published(self, mock_publish):
        """
        Check that `create_i18n_page` publishes the created page in all languages when requested.
        Don't mock `create_page` so we can easily check the call to publish.
        """
        create_i18n_page("my title", published=True, languages=["en", "fr"])
        self.assertEqual([c[0][0] for c in mock_publish.call_args_list], ["en", "fr"])
