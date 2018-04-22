"""
Unit tests for the OrganizationPage model
"""
from django.db import IntegrityError
from django.test import TestCase

from cms.api import create_page

from ..factories import OrganizationFactory
from ..models import OrganizationPage


class OrganizationPageTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the OrganizationPage model
    """
    def test_organizationpage_fields_organization_required(self):
        """
        The `organization` field should be required
        """
        page = create_page(
            'La Sorbonne',
            'organizations/cms/organization_detail.html',
            'en',
        )
        with self.assertRaises(IntegrityError) as error:
            OrganizationPage.objects.create(extended_object=page)

        # Check that the Integrity error is indeed the one that we are expecting
        self.assertIn(
            'null value in column "organization_id" violates not-null constraint',
            str(error.exception),
        )

    def test_organizationpage_fields_code_unique(self):
        """
        There should be only one organization page for a given organization and
        a given page object.
        """
        organization = OrganizationFactory()
        page = create_page(
            'La Sorbonne',
            'organizations/cms/organization_detail.html',
            'en',
        )
        OrganizationPage.objects.create(organization=organization, extended_object=page)

        # Trying to create a second organization page linked to the same objects should raise
        # a database error
        with self.assertRaises(IntegrityError) as error:
            OrganizationPage.objects.create(organization=organization, extended_object=page)

        # Check that the Integrity error is indeed the one that we are expecting
        self.assertIn(
            'unique constraint "organizations_organizationpage_extended_object_id_key',
            str(error.exception),
        )

    def test_organizationpage_str(self):
        """
        The str representation should be built with name and code fields of the
        linked organization.
        """
        organization = OrganizationFactory(name='Sorbonne', code='SOR')
        page = create_page(
            'La Sorbonne',
            'organizations/cms/organization_detail.html',
            'en',
        )
        organization_page = OrganizationPage.objects.create(
            organization=organization,
            extended_object=page,
        )
        self.assertEqual(str(organization_page), 'Organization Page: Sorbonne (SOR)')
