"""
Unit tests for the Organization model
"""
from uuid import UUID

from django.db import DataError, IntegrityError
from django.test import TestCase

from cms.api import create_page
from cms.models import Page

from ..factories import OrganizationFactory
from ..models import Organization, OrganizationPage


class OrganizationTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Organization model
    """
    def test_organization_fields_id(self):
        """
        The `id` field should be a UUID
        """
        organization = OrganizationFactory()
        # Confirm that the primary key is now a uuid
        self.assertEqual(type(organization.pk), UUID)
        self.assertEqual(len(str(organization.pk)), 36)

    def test_organization_fields_name_required(self):
        """
        The `name` field should be required
        """
        with self.assertRaises(IntegrityError):
            OrganizationFactory(name=None)

    def test_organization_fields_name_max_length(self):
        """
        The `name` field should be limited to 255 characters
        """
        OrganizationFactory(name='a'*255)
        with self.assertRaises(DataError):
            OrganizationFactory(name='a'*256)

    def test_organization_fields_code_normalization(self):
        """
        The `code` field should be normalized to improve its uniqueness
        Test with a chinese character, an emoji and a french ç...
        """
        organization = OrganizationFactory(code=' r5G yç👷学pm 44 ')
        self.assertEqual(organization.code, 'R5G-YÇ学PM-44')

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
        OrganizationFactory(code='the-unique-code')
        with self.assertRaises(IntegrityError):
            OrganizationFactory(code='the-unique-code')

    def test_organization_fields_code_max_length(self):
        """
        The `code` field should be limited to 100 characters
        """
        OrganizationFactory(code='a'*100)
        with self.assertRaises(DataError):
            OrganizationFactory(code='a'*101)

    def test_organization_fields_logo_not_required(self):
        """
        The `logo` is not required on the model
        """
        organization = OrganizationFactory(logo=None)
        self.assertIsNotNone(organization.pk)
        self.assertFalse(bool(organization.logo))

    def test_organization_str(self):
        """
        The str representation should be built with name and code fields only
        No queries to associated models should be generated
        """
        organization = Organization(name='Sorbonne', code='SOR')
        with self.assertNumQueries(0):
            self.assertEqual(str(organization), 'Organization: Sorbonne (SOR)')

    def test_organization_get_page_exists(self):
        """
        Getting the page for an organization should generate only 1 query and
        retrieve the draft version of the page.
        """
        page = create_page(
            'La Sorbonne',
            'organizations/cms/organization_detail.html',
            'en',
        )
        organization = OrganizationFactory(name='Sorbonne', code='SOR')
        OrganizationPage.objects.create(organization=organization, extended_object=page)
        page.publish('en')

        # Check that the page exists in 2 version (draft an published)
        self.assertEqual(Page.objects.count(), 2)

        # Check that we could retrieve the page in only 1 database query
        with self.assertNumQueries(1):
            retrieved_page = organization.get_page()

        # Check that the correct page was retrieved
        self.assertEqual(retrieved_page, page)
        self.assertTrue(retrieved_page.publisher_is_draft)

    def test_organization_get_page_none(self):
        """
        Trying to retrieve the page from an organization should return "None" if it
        does not exist.
        """
        organization = OrganizationFactory(name='Sorbonne', code='SOR')
        self.assertIsNone(organization.get_page())
