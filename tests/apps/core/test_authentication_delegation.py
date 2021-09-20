# -*- coding: utf-8 -*-
"""
Unit tests for the user menu
"""
import re

from django.test.utils import override_settings
from django.utils.translation import gettext_lazy as _

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase


class UserMenuTests(CMSTestCase):
    """Test the user menu according to RICHIE_AUTHENTICATION_DELEGATION settings"""

    @override_settings(
        RICHIE_AUTHENTICATION_DELEGATION={
            "BASE_URL": "https://richie.education:9999",
            "BACKEND": "richie.apps.courses.lms.base.BaseLMSBackend",
            "PROFILE_URLS": {
                "profile": {"label": "Profile", "href": _("{base_url:s}/profile")}
            },
        }
    )
    def test_user_menu_with_profile_urls(self):
        """
        User menu should render correctly and includes formatted profile_urls.
        Characters should be escaped with the `escapejs` template tag to prevent
        an issue when this variable contains unescaped characters for javascript (e.g: '\').
        """
        page = create_page(
            title="Home",
            language="en",
            published=True,
            template="richie/single_column.html",
        )
        response = self.client.get(page.get_public_url())
        self.assertContains(response, "richie-react richie-react--user-login")

        # pylint: disable=consider-using-f-string
        pattern = r".*data-props=.*{}.*{}.*".format(
            "Profile", "https://richie.education:9999/profile"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                r"\u0022authentication\u0022: "
                r"{{\u0022endpoint\u0022: \u0022{}\u0022, \u0022backend\u0022: \u0022{}\u0022}}"
            ).format(
                "https://richie.education:9999",
                "richie.apps.courses.lms.base.BaseLMSBackend",
            ),
        )

    @override_settings(RICHIE_AUTHENTICATION_DELEGATION=None)
    def test_user_menu_without_authentication_delegation(self):
        """
        If RICHIE_AUTHENTICATION_DELEGATION is not defined, user menu should not be rendered
        """
        page = create_page(
            title="Home",
            language="en",
            published=True,
            template="richie/single_column.html",
        )
        response = self.client.get(page.get_public_url())

        self.assertNotContains(response, "richie-react richie-react--user-login")
        self.assertNotContains(response, "https://richie.education:9999")
        self.assertNotContains(response, "richie.apps.courses.lms.base.BaseLMSBackend")

    @override_settings(
        RICHIE_AUTHENTICATION_DELEGATION={
            "BASE_URL": "https://richie.education:9999",
            "BACKEND": "richie.apps.courses.lms.base.BaseLMSBackend",
        }
    )
    def test_user_menu_without_profile_urls(self):
        """
        If RICHIE_AUTHENTICATION_DELEGATION.PROFILE_URLS is not defined,
        user menu should render correctly and
        profileUrls data-props should be an empty object
        """
        page = create_page(
            title="Home",
            language="en",
            published=True,
            template="richie/single_column.html",
        )
        response = self.client.get(page.get_public_url())

        self.assertContains(response, "richie-react richie-react--user-login")
        self.assertContains(response, "data-props='{\"profileUrls\": {}}'")
