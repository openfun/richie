"""
Unit tests for the Course model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import CourseFactory, OrganizationFactory
from richie.apps.courses.models import Course


class CourseModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Course model
    """

    def test_models_course_fields_organization_main_required(self):
        """
        The `organization_main` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            CourseFactory(organization_main=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_models_course_organization_main_always_included_in_organizations(self):
        """
        The main organization should always be in the organizations linked via many-to-many
        """
        organization1, organization2 = OrganizationFactory.create_batch(2)
        course = CourseFactory(organization_main=organization1)
        self.assertEqual(list(course.organizations.all()), [organization1])

        # Now set the second organization as the main
        course.organization_main = organization2
        course.save()
        self.assertEqual(course.organization_main, organization2)
        self.assertEqual(
            list(course.organizations.all()), [organization1, organization2]
        )

        # Setting an organization that is already included as many-to-many should not fail
        course.organization_main = organization1
        course.save()
        self.assertEqual(course.organization_main, organization1)
        self.assertEqual(
            list(course.organizations.all()), [organization1, organization2]
        )

    def test_models_course_str(self):
        """
        The string representation should be built with the page `title`
        fields. Only 1 query to the associated page should be generated.
        """
        page = create_page("Nano particles", "courses/cms/course_detail.html", "en")
        course = CourseFactory(extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(course), "Course: Nano particles")

    def test_models_course_organizations_copied_when_publishing(self):
        """
        When publishing a course, the links to draft organizations on the draft version of the
        course should be copied (clear then add) to set equivalent links between the corresponding
        published course and published organizations.
        """
        # Create organizations: 2 published and 1 draft
        organization1, organization2 = OrganizationFactory.create_batch(
            2, should_publish=True
        )
        organization3 = OrganizationFactory()

        # Create a draft course
        draft_course = CourseFactory(
            organization_main=organization1,
            with_organizations=[organization2, organization3],
        )

        # The course should see all organizations as the main organization should be added to
        # the organizatiions many-to-many relation
        self.assertEqual(
            set(draft_course.organizations.all()),
            {organization1, organization2, organization3},
        )

        # Publish the course and check that the organizations are copied
        draft_course.extended_object.publish("en")
        published_course = Course.objects.get(extended_object__publisher_is_draft=False)
        self.assertEqual(
            set(published_course.organizations.all()),
            {
                organization1.public_extension,
                organization2.public_extension,
                draft_course.organization_main.public_extension,
            },
        )
        # A published organization should see the published course
        self.assertEqual(
            organization1.public_extension.courses.first(), published_course
        )

        # The organizations that are removed from the draft course should only be cleared from the
        # published course upon publishing
        draft_course.organizations.remove(organization1)
        self.assertEqual(
            set(published_course.organizations.all()),
            {organization1.public_extension, organization2.public_extension},
        )
        draft_course.extended_object.publish("en")
        self.assertEqual(
            set(published_course.organizations.all()), {organization2.public_extension}
        )
        # The published organization that was removed should not see the published course any more
        self.assertIsNone(organization1.public_extension.courses.first())
