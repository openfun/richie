# -*- coding: utf-8 -*-
"""
Tests for the Keycloak authentication context processor
"""

import json

from django.test import RequestFactory, TestCase
from django.test.utils import override_settings

from richie.apps.core.context_processors import (
    FrontendContextProcessor,
    site_metas,
)


class ContextProcessorKeycloakTestCase(TestCase):
    """Test suite for the context processor with Keycloak backend"""

    MaxDiff = None

    def setUp(self):
        self.factory = RequestFactory()
        self.processor = FrontendContextProcessor()

    @override_settings(
        RICHIE_AUTHENTICATION_DELEGATION={
            "BASE_URL": "https://keycloak.test/auth",
            "BACKEND": "keycloak",
            "CLIENT_ID": "richie-client",
            "REALM": "richie-realm",
            "PROFILE_URLS": {
                "account": {
                    "label": "Account",
                    "href": "{base_url}/account",
                },
                "profile": {
                    "label": "Profile",
                    "href": "{base_url}/profile",
                },
            },
        }
    )
    def test_site_metas_keycloak_overrides_profile_urls(self):
        """
        When using Keycloak backend, site_metas should override the account URL
        with the Keycloak realm account URL and remove the profile URL.
        """
        request = self.factory.get("/")
        context = site_metas(request)

        profile_urls = json.loads(context["AUTHENTICATION"]["profile_urls"])

        # Account URL should be overridden with Keycloak realm account URL
        self.assertEqual(
            profile_urls["account"]["action"],
            "https://keycloak.test/auth/realms/richie-realm/account/"
            "?referrer=richie-client&referrer_uri=http%3A%2F%2Ftestserver%2F",
        )
        # Profile URL should be removed
        self.assertNotIn("profile", profile_urls)

    @override_settings(
        RICHIE_AUTHENTICATION_DELEGATION={
            "BASE_URL": "https://keycloak.test/auth",
            "BACKEND": "keycloak",
            "CLIENT_ID": "richie-client",
            "REALM": "richie-realm",
        }
    )
    def test_get_authentication_context_keycloak_basic(self):
        """
        When using Keycloak backend, get_authentication_context should return
        client_id, realm, and token in the context.
        """
        context = self.processor.get_authentication_context()

        self.assertEqual(
            {
                "endpoint": "https://keycloak.test/auth",
                "backend": "keycloak",
                "client_id": "richie-client",
                "realm": "richie-realm",
            },
            context,
        )

    @override_settings(
        RICHIE_AUTHENTICATION_DELEGATION={
            "BASE_URL": "https://openedx.test",
            "BACKEND": "openedx-hawthorn",
        }
    )
    def test_get_authentication_context_non_keycloak_backend(self):
        """
        When using non-Keycloak backend, only endpoint and backend should be returned.
        """
        context = self.processor.get_authentication_context()

        self.assertEqual(
            {
                "endpoint": "https://openedx.test",
                "backend": "openedx-hawthorn",
            },
            context,
        )

    @override_settings(RICHIE_AUTHENTICATION_DELEGATION=None)
    def test_get_authentication_context_no_delegation(self):
        """
        When RICHIE_AUTHENTICATION_DELEGATION is not set, get_authentication_context
        should return None.
        """
        context = self.processor.get_authentication_context()

        self.assertIsNone(context)
