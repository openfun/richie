"""
Test suite for Richie's main module
"""
from unittest import mock

from django.test import TestCase

from raven.exceptions import InvalidGitRepository

from .settings import get_release


# pylint: disable=unused-argument
class GetReleaseTestCase(TestCase):
    """Battle test the settings.get_release function"""

    @mock.patch("builtins.open", side_effect=FileNotFoundError)
    @mock.patch("raven.fetch_git_sha", side_effect=InvalidGitRepository)
    def test_returns_default_without_version_file_or_git_repository(self, *args):
        """
        When no version.json file exists nor a Git repository, we expect that
        get_release() returns the default value
        """
        self.assertEqual(get_release(), "NA")

    @mock.patch("builtins.open", mock.mock_open(read_data="""{"commit": "3ba84e7"}"""))
    @mock.patch("raven.fetch_git_sha", side_effect=InvalidGitRepository)
    def test_get_release_from_a_valid_version_file(self, *args):
        """
        Get release from the version.json file that is supposed to exists (and
        be formatted as expected) as we mock the open function
        """
        self.assertEqual(get_release(), "3ba84e7")

    @mock.patch("builtins.open", mock.mock_open(read_data="""{"foo": "3ba84e7"}"""))
    @mock.patch("raven.fetch_git_sha", side_effect=InvalidGitRepository)
    def test_get_release_from_an_invalid_version_file(self, *args):
        """
        Get release from the version.json file that is supposed to exists (and
        be formatted as expected) as we mock the open function
        """
        with self.assertRaises(KeyError):
            get_release()

    @mock.patch("builtins.open", side_effect=FileNotFoundError)
    @mock.patch("raven.fetch_git_sha", return_value="3ba84e7")
    def test_get_release_from_git_repository(self, *args):
        """
        Get release from the local git repository
        """
        self.assertEqual(get_release(), "3ba84e7")
