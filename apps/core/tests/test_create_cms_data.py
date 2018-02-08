"""
create_cms_data management command tests
"""
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test.utils import override_settings

from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from ..management.commands.create_cms_data import create_cms_data, PAGES, NB_ORGANIZATIONS


class CreateCmsDataTests(CMSTestCase):
    """Create CMS data base test case"""

    @override_settings(DEBUG=False)
    def test_command(self):
        """
        Command should not run whitout --force flag
        if DEBUG=False
        """
        with self.assertRaises(CommandError):
            call_command('create_cms_data')

    def test_command_success(self):
        """ Test create_cms_data management command creates
        """
        create_cms_data()
        expected_pages = (len(PAGES) + NB_ORGANIZATIONS) * 2
        self.assertEqual(expected_pages, Page.objects.all().count())

        # Get root page in french
        root = Page.objects.get_home()
        response = self.client.get(root.get_absolute_url('fr'))
        self.assertEqual(200, response.status_code)
        # ensure french first level page menu is present
        for page in PAGES.values():
            self.assertIn(page['fr'], response.rendered_content)

        # Get root page in english
        response = self.client.get(root.get_absolute_url('en'))
        self.assertEqual(200, response.status_code)
        # ensure english first level page menu is present
        for page in PAGES.values():
            self.assertIn(page['en'], response.rendered_content)
