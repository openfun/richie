"""
Test suite for all helpers in the `core` application
"""
from unittest import mock

from cms.api import Page
from cms.test_utils.testcases import CMSTestCase

from ..helpers import create_i18n_page


class CreateI18nPageTestCase(CMSTestCase):
    """Test suite for the `create_i18n_page` helper"""

    @mock.patch.object(Page, "set_as_homepage")
    @mock.patch("apps.core.helpers.add_plugin")
    @mock.patch("apps.core.helpers.create_title")
    def test_utils_create_i18n_page(self, mock_title, mock_plugin, mock_homepage):
        """
        Calling `create_i18n_page` should delegate create actions to DjangoCMS' methods
        Don't mock `create_page` so we can easily check the absence of call to set it as homepage
        """
        content = {"fr": "Titre français", "en": "English title"}
        page = create_i18n_page(content, template="richie/fullwidth.html")

        # Check that the calls were triggered as expected
        # - create_page
        self.assertEqual(page.get_title(), "Titre français")
        self.assertEqual(page.get_slug(), "titre-francais")

        # create_title
        mock_title.assert_called_once_with(
            language="en",
            menu_title="English title",
            page=page,
            slug="english-title",
            title="English title",
        )
        # add_plugin
        self.assertEqual(mock_plugin.call_count, 2)
        self.assertEqual(
            mock_plugin.call_args_list[0],
            (
                {
                    "body": "[fr] Lorem ipsum...",
                    "language": "fr",
                    "placeholder": mock.ANY,
                    "plugin_type": "TextPlugin",
                },
            ),
        )
        self.assertEqual(
            mock_plugin.call_args_list[1],
            (
                {
                    "body": "[en] Lorem ipsum...",
                    "language": "en",
                    "placeholder": mock.ANY,
                    "plugin_type": "TextPlugin",
                },
            ),
        )

        self.assertFalse(mock_homepage.called)

    # pylint: disable=no-member,unused-argument
    @mock.patch("apps.core.helpers.add_plugin")
    @mock.patch("apps.core.helpers.create_title")
    @mock.patch.object(Page, "set_as_homepage")
    def test_utils_create_i18n_page_homepage(self, mock_homepage, *args):
        """
        Check that `create_i18n_page` can set the created page as homepage
        Don't mock `create_page` so we can easily check the call to set it as homepage
        """
        content = {"fr": "Titre français", "en": "English title"}
        create_i18n_page(content, is_homepage=True, template="richie/fullwidth.html")
        self.assertTrue(mock_homepage.called)
