"""
create_cms_data management command tests
"""
from logging import Logger
from unittest import mock

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from apps.organizations.factories import OrganizationFactory

from ..management.commands.create_cms_data import create_cms_data


class CreateCmsDataTests(CMSTestCase):
    """Create CMS data base test case"""

    @override_settings(DEBUG=False)
    def test_command_force(self):
        """
        The command should not run whitout the --force option if DEBUG is False
        """
        with self.assertRaises(CommandError):
            call_command("create_cms_data")

    @override_settings(DEBUG=True)
    @mock.patch.object(Logger, "info")
    @mock.patch("apps.core.management.commands.create_cms_data.clear_cms_data")
    @mock.patch("apps.core.management.commands.create_cms_data.create_cms_data")
    def test_command_success(self, mock_create, mock_clear, mock_logger):
        """
        The command should delete and recreate the sample site when DEBUG is True
        The result should be posted to an info logger
        """
        self.assertTrue(settings.DEBUG)
        call_command("create_cms_data")
        mock_clear.assert_called_once_with()
        mock_create.assert_called_once_with()
        mock_logger.assert_called_once_with("done")

    @mock.patch.object(OrganizationFactory, "create")
    @mock.patch("apps.core.management.commands.create_cms_data.create_i18n_page")
    def test_command_create_cms_data(self, mock_page, mock_organization):
        """
        Calling the `create_cms_data` function should trigger creating root i18n pages and
        organizations below the related page
        """
        # Let the mock return a number instead of the page so we can easily reference them below
        mock_page.side_effect = range(14)

        # Call the method and check its effects in what follows
        create_cms_data()

        # Check that the number of pages created is as expected
        self.assertEqual(mock_page.call_count, 6 + 8)  # 6 root pages + 8 organizations

        # Check that the calls to create the root pages are triggered as expected
        site = Site.objects.get()
        expected_calls_for_root_pages = [
            (
                ({"en": "Home", "fr": "Accueil"},),
                {
                    "in_navigation": True,
                    "is_homepage": True,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "News", "fr": "Actualités"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "All courses", "fr": "Tous les cours"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "Organizations", "fr": "Etablissements"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "Dashboard", "fr": "Tableau de bord"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "About", "fr": "A propos"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
        ]
        self.assertEqual(mock_page.call_args_list[:6], expected_calls_for_root_pages)

        # Check that the calls to create the organizations were triggered as expected
        self.assertEqual(mock_organization.call_count, 8)

        for i, actual_call in enumerate(mock_page.call_args_list[6:]):
            expected_call = (
                (
                    {
                        "en": "Organization #{:d}".format(i),
                        "fr": "Organisation #{:d}".format(i),
                    },
                ),
                {
                    "parent": 3,
                    "published": True,
                    "site": site,
                    "template": "organizations/cms/organization_detail.html",
                },
            )
            self.assertEqual(actual_call, expected_call)
