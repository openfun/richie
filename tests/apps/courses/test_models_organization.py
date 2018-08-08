"""
Unit tests for the Organization model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import CourseFactory, OrganizationFactory
from richie.apps.courses.models import Organization


class OrganizationModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Organization model
    """

    def test_models_organization_fields_code_normalization(self):
        """
        The `code` field should be normalized to improve its uniqueness
        Test with a chinese character, an emoji and a french ç...
        """
        organization = OrganizationFactory(code=" r5G yç👷学pm 44 ")
        self.assertEqual(organization.code, "R5G-YÇ学PM-44")

    def test_models_organization_fields_code_required(self):
        """
        The `code` field should not be required
        """
        organization = OrganizationFactory(code=None)
        self.assertIsNone(organization.code)

    def test_models_organization_fields_code_unique(self):
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

    def test_models_organization_fields_code_max_length(self):
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

    def test_models_organization_str(self):
        """
        The str representation should be built with the page title and code field only.
        A query to the associated page should be generated.
        """
        page = create_page("La Sorbonne", "courses/cms/organization_detail.html", "en")
        organization = Organization(code="SOR", extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(organization), "Organization: La Sorbonne (SOR)")

    def test_models_organization_courses_copied_when_publishing(self):
        """
        When publishing a organization, the links to draft courses on the draft version of the
        organization should be copied (clear then add) to the published version.
        Links to published courses should not be copied as they are redundant and not
        up-to-date.
        """
        # Create draft courses
        course1, course2 = CourseFactory.create_batch(2)

        # Create a draft organization
        draft_organization = OrganizationFactory(with_courses=[course1, course2])

        # Publish course1
        course1.extended_object.publish("en")
        course1.refresh_from_db()

        # The draft organization should see all courses and propose a custom filter to easily
        # access the draft versions
        self.assertEqual(
            set(draft_organization.courses.all()),
            {course1, course1.public_extension, course2},
        )
        self.assertEqual(set(draft_organization.courses.drafts()), {course1, course2})

        # Publish the organization and check that the courses are copied
        draft_organization.extended_object.publish("en")
        published_organization = Organization.objects.get(
            extended_object__publisher_is_draft=False
        )
        self.assertEqual(set(published_organization.courses.all()), {course1, course2})

        # When publishing, the courses that are obsolete should be cleared
        draft_organization.courses.remove(course2)
        self.assertEqual(set(published_organization.courses.all()), {course1, course2})

        # courses on the published organization are only cleared after publishing the draft page
        draft_organization.extended_object.publish("en")
        self.assertEqual(set(published_organization.courses.all()), {course1})
