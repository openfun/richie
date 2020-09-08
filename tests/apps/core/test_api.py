"""Tests for user-related API endpoints."""
import json

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.test.utils import override_settings


class ApiUsersViewSetTestCase(TestCase):
    """Test requests on user-related API endpoints."""

    def test_viewsets_users_whoami_anonymous(self):
        """whoami returns a 401 when request by an anonymous (not logged in) user."""
        response = self.client.get("/api/v1.0/users/whoami/")
        self.assertEqual(response.status_code, 401)

    @override_settings(
        LMS_BACKENDS=[{"BASE_URL": "https://www.example.com"}],
        MAIN_LMS_USER_URLS=[
            {"label": "Test", "href": "{base_url:s}/user/{username:s}"}
        ],
    )
    def test_viewsets_users_whoami_logged_in(self):
        """
        whoami returns information about the current user when requested by a
        logged in user.
        It also binds urls defined into MAIN_LMS_USER_URLS setting.
        """
        # Create a stub user and force-login it to test our API
        user = get_user_model().objects.create_user(
            email="juv@example.com",
            first_name="Decimus Iunius",
            last_name="Iuvenalis",
            password="saturas",
            username="juvénal",
        )
        self.client.force_login(user)

        # User is returned as expected
        response = self.client.get("/api/v1.0/users/whoami/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "full_name": "Decimus Iunius Iuvenalis",
                "username": "juvénal",
                "urls": [
                    {"label": "Test", "href": "https://www.example.com/user/juvénal"},
                ],
            },
        )
