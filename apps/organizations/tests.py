"""
Organizations application tests
"""

from cms.test_utils.testcases import CMSTestCase
from django.core.management import call_command
from django.core.management.base import CommandError


class OrganizationTests(CMSTestCase):
    """Organization tests"""

    def test_command(self):
        """Command should not run whitout --force flag"""

        with self.assertRaises(CommandError):
            call_command('create_cms_data')
