"""
Unit tests for the Organization model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from cms.api import create_page

from ..factories import OrganizationFactory
from ..models import Organization


class OrganizationTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Organization model
    """

    def test_organization_fields_code_normalization(self):
        """
        The `code` field should be normalized to improve its uniqueness
        Test with a chinese character, an emoji and a french ç...
        """
        organization = OrganizationFactory(code=" r5G yç👷学pm 44 ")
        self.assertEqual(organization.code, "R5G-YÇ学PM-44")

    def test_organization_fields_code_required(self):
        """
        The `code` field should not be required
        """
        organization = OrganizationFactory(code=None)
        self.assertIsNone(organization.code)

    def test_organization_fields_code_unique(self):
        """
        The `code` field should be unique
        """
        organization = OrganizationFactory(code="the-unique-code")

        # Creating a second organization with the same code should raise an error...
        with self.assertRaises(ValidationError) as context:
            OrganizationFactory(code="the-unique-code")
        self.assertEqual(
            context.exception.messages[0],
            "An Organization already exists with this code.",
        )
        self.assertEqual(Organization.objects.filter(code="THE-UNIQUE-CODE").count(), 1)

        # ... but the page extension can exist in draft and published versions
        organization.extended_object.publish("en")
        self.assertEqual(Organization.objects.filter(code="THE-UNIQUE-CODE").count(), 2)

    def test_organization_fields_code_max_length(self):
        """
        The `code` field should be limited to 100 characters
        """
        OrganizationFactory(code="a" * 100)
        with self.assertRaises(ValidationError) as context:
            OrganizationFactory(code="b" * 101)
        self.assertEqual(
            context.exception.messages[0],
            "Ensure this value has at most 100 characters (it has 101).",
        )

    def test_organization_fields_logo_not_required(self):
        """
        The `logo` is not required on the model
        """
        organization = OrganizationFactory(logo=None)
        self.assertIsNotNone(organization.pk)
        self.assertFalse(bool(organization.logo))

    def test_organization_str(self):
        """
        The str representation should be built with the page title and code field only.
        A query to the associated page should be generated.
        """
        page = create_page("La Sorbonne", "courses/cms/organization_detail.html", "en")
        organization = Organization(code="SOR", extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(organization), "Organization: La Sorbonne (SOR)")
