"""Test suite for the bootstrap_elasticsearch view of richie's search app."""

import json
from unittest import mock

from django.contrib.messages import get_messages

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory


class BootstrapElasticsearchViewTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of the `bootstrap_elasticsearch` view.
    """

    @mock.patch("django.core.management.call_command")
    def test_views_bootstrap_elasticsearch_with_permission(self, mock_command):
        """Confirm triggering the search index bootstrapping works as expected."""
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add the necessary permission
        self.add_permission(user, "can_manage_elasticsearch")

        url = "/api/v1.0/bootstrap-elasticsearch/"
        response = self.client.post(url, follow=True)
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(content, {})

        # Check the presence of a confirmation message
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertEqual(
            str(messages[0]), "The search index was successfully bootstrapped"
        )

        mock_command.assert_called_once_with("bootstrap_elasticsearch")

    @mock.patch("django.core.management.call_command")
    def test_views_bootstrap_elasticsearch_no_permission(self, mock_command):
        """Bootstrapping ES should be forbidden if the permission is not not granted."""
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        url = "/api/v1.0/bootstrap-elasticsearch/"
        response = self.client.post(url, follow=True)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.content, b"You are not allowed to manage the search index."
        )
        self.assertFalse(mock_command.called)

    @mock.patch("django.core.management.call_command")
    def test_views_bootstrap_elasticsearch_post_required(self, mock_command):
        """Bootstrapping ES can only be triggered with a POST method."""
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add the necessary permission
        self.add_permission(user, "can_manage_elasticsearch")

        url = "/api/v1.0/bootstrap-elasticsearch/"

        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 405)

        response = self.client.put(url, follow=True)
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(url, follow=True)
        self.assertEqual(response.status_code, 405)

        self.assertFalse(mock_command.called)

    @mock.patch("django.core.management.call_command")
    def test_views_bootstrap_elasticsearch_anonymous(self, mock_command):
        """An anonymous user should not be allowed to bootstrap ES."""
        url = "/api/v1.0/bootstrap-elasticsearch/"
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 401)
        self.assertFalse(mock_command.called)

    @mock.patch("django.core.management.call_command")
    def test_views_bootstrap_elasticsearch_not_staff_with_permission(
        self, mock_command
    ):
        """A user with permissions that is not staff should not be allowed to bootstrap ES."""
        user = UserFactory()
        self.client.login(username=user.username, password="password")

        # Add the necessary permission
        self.add_permission(user, "can_manage_elasticsearch")

        url = "/api/v1.0/bootstrap-elasticsearch/"
        response = self.client.post(url, follow=True)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.content, b"You are not allowed to manage the search index."
        )
        self.assertFalse(mock_command.called)
