"""
Test suite defining the admin pages for the Licence model
"""

from django.urls import reverse
from django.utils import translation

from cms.test_utils.testcases import CMSTestCase
from parler.utils.context import switch_language

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import LicenceFactory


class LicenceAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Licence model
    """

    def test_admin_licence_index(self):
        """Licences should be listed on the index."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin index view
        url = reverse("admin:index")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that a link to the licence list view is on the page
        licence_url = reverse("admin:courses_licence_changelist")
        self.assertContains(response, licence_url)

    def test_admin_licence_list_view(self):
        """
        The admin list view of licences should display the name of the licence.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a licence with English fields and French translations
        licence = LicenceFactory(name="some licence name")
        with switch_language(licence, "fr"):
            licence.name = "quelque nom de licence"
            licence.save()

        # Get the admin list view in English
        url = reverse("admin:courses_licence_changelist")
        response = self.client.get(url, follow=True)

        # Check that the page includes the name in English
        with switch_language(licence, "en"):
            self.assertContains(response, licence.name, status_code=200)

        # Get the admin change view in French
        with translation.override("fr"):
            url = reverse("admin:courses_licence_changelist")
        response = self.client.get(url)

        # Check that the page includes the name in French
        with switch_language(licence, "fr"):
            self.assertContains(response, licence.name)

    def test_admin_licence_add_view(self):
        """
        The admin add view should work for licences.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:courses_licence_add")
        response = self.client.get(url, follow=True)

        # The admin change view includes localization elements
        self.assertContains(response, "English")
        self.assertContains(response, "French")

    def test_admin_licence_change_view_get(self):
        """
        The admin change view should include the name and content fields for the given language.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a licence with English fields and French translations
        licence = LicenceFactory(
            name="some licence name", content="some licence text content"
        )
        with switch_language(licence, "fr"):
            licence.name = "quelque nom de licence"
            licence.content = "quelque contenu textuel de licence"
            licence.save()

        # Get the admin change view in English
        url = reverse("admin:courses_licence_change", args=[licence.id])
        response = self.client.get(url)

        # Check that the page includes the name and content in English
        with switch_language(licence, "en"):
            self.assertContains(response, licence.name)
            self.assertContains(response, licence.content)

        # Get the admin change view in French
        url = reverse("admin:courses_licence_change", args=[licence.id])
        response = self.client.get(f"{url:s}?language=fr")

        # Check that the page includes the name and content in French
        with switch_language(licence, "fr"):
            self.assertContains(response, licence.name)
            self.assertContains(response, licence.content)
