from django.core.management import call_command
from django.core.management.base import CommandError
from cms.test_utils.testcases import CMSTestCase


class OrganizationTests(CMSTestCase):
    def test_command(self):
        """Command should not run whitout --force flag"""
        with self.assertRaises(CommandError):
            call_command('create_cms_data')
