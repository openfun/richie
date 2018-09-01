"""
create_demo_site management command tests
"""
from logging import Logger
from unittest import mock

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase


class CreateDemoSiteCommandsTestCase(CMSTestCase):
    """Test the command that creates a demo site from factories with realistic fake data."""

    @override_settings(DEBUG=False)
    def test_commands_create_demo_site_force(self):
        """
        The command should not run whitout the --force option if DEBUG is False
        """
        with self.assertRaises(CommandError):
            call_command("create_demo_site")

    @override_settings(DEBUG=True)
    @mock.patch.object(Logger, "info")
    @mock.patch("richie.apps.core.management.commands.create_demo_site.clear_cms_data")
    @mock.patch(
        "richie.apps.core.management.commands.create_demo_site.create_demo_site"
    )
    def test_commands_create_demo_site_success(
        self, mock_create, mock_clear, mock_logger
    ):
        """
        The command should delete and recreate the sample site when DEBUG is True
        The result should be posted to an info logger

        Note:
            This test confirms that the factories for each type of page are called
            as expected. It does not guarantee that the actual "create_demo_site"
            command will work if the factories themselves are not well tested.
        """
        self.assertTrue(settings.DEBUG)
        call_command("create_demo_site")
        mock_clear.assert_called_once_with()
        mock_create.assert_called_once_with()
        mock_logger.assert_called_once_with("done")
