"""
Test suite for Organization admin
"""

from django.urls import reverse

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import OrganizationFactory


class OrganizationAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Organization
    model
    """

    def test_admin_organization_index(self):
        """Organizations should not be listed on the index as they are page extensions."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin index view
        url = reverse("admin:index")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that a link to the organization list view is not on the page
        organization_url = reverse("admin:courses_organization_changelist")
        self.assertNotContains(response, organization_url)

    def test_admin_organization_list_view(self):
        """
        The organizations admin list view should display their code and the title of the
        related page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization linked to a page
        organization = OrganizationFactory()

        # Get the admin list view
        url = reverse("admin:courses_organization_changelist")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our fields
        self.assertContains(
            response, organization.extended_object.get_title(), status_code=200
        )
        self.assertContains(response, organization.code)

    def test_admin_organization_add_view(self):
        """
        The admin add view should work for organizations
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:courses_organization_add")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our fields
        self.assertContains(response, "id_code")

    def test_admin_organization_change_view_get(self):
        """
        The admin change view should work for organizations
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization linked to a page
        page = create_page("My title", "richie/single_column.html", "en")
        organization = OrganizationFactory(extended_object=page)

        # Get the admin change view
        url = reverse("admin:courses_organization_change", args=[organization.id])
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(response, "My title", status_code=200)
        self.assertContains(response, organization.code)

    def test_admin_organization_change_view_post(self):
        """
        Validate that the organization can be updated via the admin.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization
        organization = OrganizationFactory()

        # Get the admin change view
        url = reverse("admin:courses_organization_change", args=[organization.id])
        data = {"code": " r5G yç👷学pm 44 "}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)

        # Check that the organization was updated as expected
        organization.refresh_from_db()
        self.assertEqual(organization.code, "R5G-YÇ学PM-44")
