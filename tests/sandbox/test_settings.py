"""
Test suite for Richie's main module
"""
from unittest import mock

from django.test import TestCase

# sandbox
from sandbox.settings import get_release


# pylint: disable=unused-argument
class GetReleaseTestCase(TestCase):
    """Battle test the settings.get_release function"""

    @mock.patch("builtins.open", side_effect=FileNotFoundError)
    def test_returns_default_without_version_file(self, *args):
        """
        When no version.json file exists, we expect that get_release() returns
        the default value
        """
        self.assertEqual(get_release(), "NA")

    @mock.patch("builtins.open", mock.mock_open(read_data="""{"version": "1.0.1"}"""))
    def test_get_release_from_a_valid_version_file(self, *args):
        """
        Get release from the version.json file that is supposed to exists (and
        be formatted as expected) as we mock the open function
        """
        self.assertEqual(get_release(), "1.0.1")

    @mock.patch("builtins.open", mock.mock_open(read_data="""{"foo": "3ba84e7"}"""))
    def test_get_release_from_an_invalid_version_file(self, *args):
        """
        Get release from the version.json file that is supposed to exists (and
        not be formatted as expected) as we mock the open function
        """
        with self.assertRaises(KeyError):
            get_release()
