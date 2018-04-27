"""
End-to-end tests for the organization detail view
"""
from django.test import TestCase

from cms.api import create_page

from ..factories import OrganizationFactory
from ..models import OrganizationPage


class OrganizationCMSTestCase(TestCase):
    """
    End-to-end test suite to validate the content and Ux of the organization detail view
    """

    def test_organization_cms_published_content(self):
        """
        Validate that the important elements are displayed once a page is published
        """
        organization = OrganizationFactory(name="la Sorbonne", logo="my_logo.jpg")
        page = create_page(
            "La Sorbonne", "organizations/cms/organization_detail.html", "en"
        )
        OrganizationPage.objects.create(organization=organization, extended_object=page)

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Now publish the page and check that it is now visible
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response, "<title>La Sorbonne</title>", status_code=200, html=True
        )
        self.assertContains(response, "<h1>La Sorbonne</h1>", html=True)
        self.assertContains(
            response, '<img src="/media/my_logo.jpg" alt="La Sorbonne logo">', html=True
        )
