"""
Test suite for Richie's main module
"""

from unittest import mock

from django.conf import settings
from django.test import TestCase, override_settings

from rest_framework.response import Response
from rest_framework.settings import DEFAULTS, api_settings

from richie.apps.search.viewsets.courses import CoursesViewSet

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

    @mock.patch.object(CoursesViewSet, "list", spec=True, return_value=Response({}))
    def test_configuration_restframework_htaccess(self, _mock_list):
        """The search API endpoint should work behind an htaccess."""
        # First, check that API calls were broken with the default DRF configuration
        # What was happening is that DRF defines Basic Authentication as a fallback by default
        # and our query has a basic auth header with the username and password of the htaccess
        # defined in nginx. Django was trying to authenticate a user with these credentials,
        # which of course failed.
        with override_settings(
            REST_FRAMEWORK={
                **settings.REST_FRAMEWORK,
                "DEFAULT_AUTHENTICATION_CLASSES": DEFAULTS[
                    "DEFAULT_AUTHENTICATION_CLASSES"
                ],
            }
        ):
            authentication_classes = api_settings.DEFAULT_AUTHENTICATION_CLASSES

        # The authentication classes are loaded before settings are overriden so we need
        # to mock them on the APIView
        with mock.patch(
            "rest_framework.views.APIView.authentication_classes",
            new_callable=mock.PropertyMock,
            return_value=authentication_classes,
        ):
            response = self.client.get(
                "/api/v1.0/courses/",
                HTTP_AUTHORIZATION="Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
            )
        self.assertEqual(response.status_code, 403)

        # Check that the project configuration solves it
        response = self.client.get(
            "/api/v1.0/courses/", HTTP_AUTHORIZATION="Basic dXNlcm5hbWU6cGFzc3dvcmQ="
        )
        self.assertEqual(response.status_code, 200)
