from django.test import TestCase

from cms.models import Page

from ..management.commands.create_cms_data import create_cms_data, PAGES, ORGANIZATIONS


class SiteStructureBaseTestCase(TestCase):
    """The purpose of this testcase is to be used by other applications
    and CMS plugins to run theirs tests in a realistic site structure."""
    def setUp(self):
        create_cms_data()


class SiteStructureTest(SiteStructureBaseTestCase):
    """Test SiteStructureBaseTestCase works"""
    def test(self):
        """Test testcase created root page + all children pages for 2 languages."""
        self.assertEqual((1 + len(PAGES) + len(ORGANIZATIONS)) * 2, Page.objects.all().count())
