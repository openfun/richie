"""
Test suite for Organization admin
"""
from django.core.urlresolvers import reverse

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase

from apps.core.factories import UserFactory
from ..factories import OrganizationFactory

from ..models import OrganizationPage


class OrganizationAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Organization model
    """

    def test_organization_list_view(self):
        """
        When the organization is related to a CMS page, the admin list view should display a link
        to this page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization linked to a page
        page = create_page("My title", "richie/fullwidth.html", "en")
        organization = OrganizationFactory()
        OrganizationPage.objects.create(organization=organization, extended_object=page)

        # Get the admin list view
        url = reverse("admin:organizations_organization_changelist")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our fields
        self.assertContains(response, organization.name, status_code=200)
        self.assertContains(response, organization.code)
        self.assertContains(
            response,
            '<td class="field-view_in_cms"><a href="/en/my-title/" target="_blank">View</a></td>',
            html=True,
        )

    def test_organization_list_view_no_page(self):
        """
        When the organization is not related to a CMS page, the amdin list view should display
        `(no-code)` instead of the link to the associated page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization not linked to a page
        OrganizationFactory()

        # Get the admin list view
        url = reverse("admin:organizations_organization_changelist")
        response = self.client.get(url, follow=True)

        # Check that the page includes the hyphen
        self.assertContains(
            response,
            '<td class="field-view_in_cms">(no page)</td>',
            status_code=200,
            html=True,
        )

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
        for field in ["name", "code", "logo"]:
            self.assertContains(response, "id_{:s}".format(field))

    def test_organization_change_view(self):
        """
        The admin change view should work for organizations
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create an organization linked to a page
        page = create_page("My title", "richie/fullwidth.html", "en")
        organization = OrganizationFactory()
        OrganizationPage.objects.create(organization=organization, extended_object=page)

        # Get the admin change view
        url = reverse("admin:organizations_organization_change", args=[organization.id])
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(response, organization.name, status_code=200)
        self.assertContains(response, organization.code)
