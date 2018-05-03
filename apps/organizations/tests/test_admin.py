"""
Test suite for Organization admin
"""
from django.core.urlresolvers import reverse

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase

from apps.core.factories import UserFactory
from ..factories import OrganizationFactory


class OrganizationAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Organization
    model
    """

    def test_organization_list_view(self):
        """
        The organizations admin list view should display their code and the title of the
        related page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization linked to a page
        page = create_page("My title", "richie/fullwidth.html", "en")
        organization = OrganizationFactory(extended_object=page)

        # Get the admin list view
        url = reverse("admin:organizations_organization_changelist")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our fields
        self.assertContains(response, page.get_title(), status_code=200)
        self.assertContains(response, organization.code)

    def test_organization_add_view(self):
        """
        The admin add view should work for organizations
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:organizations_organization_add")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our fields
        for field in ["code", "logo"]:
            self.assertContains(response, "id_{:s}".format(field))

    def test_organization_change_view(self):
        """
        The admin change view should work for organizations
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization linked to a page
        page = create_page("My title", "richie/fullwidth.html", "en")
        organization = OrganizationFactory(extended_object=page)

        # Get the admin change view
        url = reverse("admin:organizations_organization_change", args=[organization.id])
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(response, "My title", status_code=200)
        self.assertContains(response, organization.code)
