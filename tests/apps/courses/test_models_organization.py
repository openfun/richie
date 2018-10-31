"""
Unit tests for the Organization model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import CourseFactory, OrganizationFactory
from richie.apps.courses.models import Course, Organization


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

    def test_models_organization_get_courses(self):
        """
        It should be possible to retrieve the list of related courses on the organization instance.
        The number of queries should be minimal.
        """
        organization = OrganizationFactory(should_publish=True)
        courses = CourseFactory.create_batch(
            3, fill_organizations=[organization], title="my title", should_publish=True
        )
        retrieved_courses = organization.get_courses()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_courses), set(courses))

        with self.assertNumQueries(0):
            for course in retrieved_courses:
                self.assertEqual(
                    course.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_organization_get_courses_several_languages(self):
        """
        The courses should not be duplicated if they exist in several languages.
        """
        organization = OrganizationFactory(should_publish=True)
        CourseFactory(
            title={"en": "my title", "fr": "mon titre"},
            fill_organizations=[organization],
            should_publish=True,
        )
        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(organization.get_courses().count(), 1)
