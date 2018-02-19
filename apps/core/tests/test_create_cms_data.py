"""
create_cms_data management command tests
"""
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test.utils import override_settings

from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from ..management.commands.create_cms_data import create_cms_data, PAGES, ORGANIZATIONS


class CreateCmsDataTests(CMSTestCase):
    """Create CMS data base test case"""

    @override_settings(DEBUG=False)
    def test_command(self):
        """Command should not run whitout --force flag"""
        with self.assertRaises(CommandError):
            call_command('create_cms_data')


class SiteStructureBaseTestCase(CMSTestCase):
    """The purpose of this testcase is to be used by other applications
    and CMS plugins to run theirs tests in a realistic site structure."""
    def setUp(self):
        create_cms_data()


# CMSTestCase has many ancestors (7), hence for now, we choose to disable this
# pylint rule instead of increasing its theshold (>7).
#
# pylint: disable=too-many-ancestors
class SiteStructureTest(SiteStructureBaseTestCase):
    """Test SiteStructureBaseTestCase works"""

    def test(self):
        """
        Test page created by provisioning script
            - root page
            - first level pages for 2 languages.
            - organizations pages
        """

        expected_pages = (1 + len(PAGES) + len(ORGANIZATIONS)) * 2
        self.assertEqual(expected_pages, Page.objects.all().count())
