"""
Test suite for pipeline user.
"""
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory, TestCase, override_settings

from social_core.exceptions import AuthAlreadyAssociated, AuthFailed
from social_django.utils import load_backend, load_strategy

from richie.apps.core.factories import UserFactory
from richie.apps.social.pipeline.user import get_username


class PipelineUserTestCase(TestCase):
    """Tests for pipeline user."""

    def setUp(self):
        """Configure social-auth strategy."""
        self.request_factory = RequestFactory()
        self.request = self.request_factory.get("/")
        SessionMiddleware().process_request(self.request)
        self.strategy = load_strategy(request=self.request)

    @override_settings(SOCIAL_AUTH_USER_FIELDS={})
    def test_get_username_no_username_in_backend(self):
        """if username is not in backend settings should return None."""
        backend = load_backend(
            strategy=self.strategy, name="edx-oauth2", redirect_uri="/"
        )

        self.assertIsNone(get_username(self.strategy, {}, backend))

    def test_get_username_user_connected(self):
        """The user is already connected, its username is fetched and returned."""
        backend = load_backend(
            strategy=self.strategy, name="edx-oauth2", redirect_uri="/"
        )
        user = UserFactory(username="John Doe")

        self.assertEqual(
            get_username(self.strategy, {}, backend, user), {"username": "John Doe"}
        )

    @override_settings(SOCIAL_AUTH_USERNAME_IS_FULL_EMAIL=True)
    def test_get_username_no_user_connected_email_as_username(self):
        """No user connected and should return the email as username."""
        backend = load_backend(
            strategy=self.strategy, name="edx-oauth2", redirect_uri="/"
        )

        self.assertEqual(
            get_username(self.strategy, {"email": "john@doe.org"}, backend),
            {"username": "john@doe.org"},
        )

    def test_get_username_no_user_and_username_available(self):
        """No user connected, the username is in the details and is available."""
        backend = load_backend(
            strategy=self.strategy, name="edx-oauth2", redirect_uri="/"
        )

        self.assertEqual(
            get_username(self.strategy, {"username": "John Doe"}, backend),
            {"username": "John Doe"},
        )

    def test_get_username_no_user_and_no_username_available(self):
        """
        No user connected and no username available in the details.
        Should throw an exception.
        """
        backend = load_backend(
            strategy=self.strategy, name="edx-oauth2", redirect_uri="/"
        )

        with self.assertRaises(AuthFailed):
            get_username(self.strategy, {}, backend)

    def test_get_username_no_user_and_username_already_saved(self):
        """No user connected and the username is already saved. Should throw an exception."""
        backend = load_backend(
            strategy=self.strategy, name="edx-oauth2", redirect_uri="/"
        )

        UserFactory(username="John Doe")

        with self.assertRaises(AuthAlreadyAssociated):
            get_username(self.strategy, {"username": "John Doe"}, backend)
