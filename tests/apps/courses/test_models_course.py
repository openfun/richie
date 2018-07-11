"""
Unit tests for the Course model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import (
    CourseFactory,
    OrganizationFactory,
    SubjectFactory,
)
from richie.apps.courses.models import Course


class CourseTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Course model
    """

    def test_course_fields_organization_main_required(self):
        """
        The `organization_main` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            CourseFactory(organization_main=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_course_fields_active_session_required(self):
        """
        The `active_session` field should not be required
        """
        course = CourseFactory(active_session=None)
        self.assertIsNone(course.active_session)

    def test_course_fields_active_session_max_length(self):
        """
        The `active_session` field should be limited to 200 characters
        """
        CourseFactory(active_session="a" * 200)
        with self.assertRaises(ValidationError) as context:
            CourseFactory(active_session="a" * 201)
        self.assertEqual(
            context.exception.messages[0],
            "Ensure this value has at most 200 characters (it has 201).",
        )

    def test_course_fields_active_session_unique(self):
        """
        The `active_session` field should be unique
        """
        course = CourseFactory(active_session="the-unique-key")
        # Creating a second organization with the same active session should raise an error...
        with self.assertRaises(ValidationError) as context:
            CourseFactory(active_session="the-unique-key")
        self.assertEqual(
            context.exception.messages[0],
            "A course already exists with this active session.",
        )
        self.assertEqual(
            Course.objects.filter(active_session="the-unique-key").count(), 1
        )

        # ... but the page extension can exist in draft and published versions
        course.extended_object.publish("en")
        self.assertEqual(
            Course.objects.filter(active_session="the-unique-key").count(), 2
        )

    def test_course_organization_main_always_included_in_organizations(self):
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

    def test_course_str(self):
        """
        The string representation should be built with the page `title` and `active_session`
        fields. Only 1 query to the associated page should be generated.
        """
        page = create_page("Nano particles", "courses/cms/course_detail.html", "en")
        course = CourseFactory(active_session="course-key", extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(course), "Course: Nano particles (course-key)")

    def test_course_str_no_active_session(self):
        """
        The string representation of a course with no active session should display
        "no active session".
        """
        page = create_page("Nano particles", "courses/cms/course_detail.html", "en")
        course = CourseFactory(active_session=None, extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(course), "Course: Nano particles (no active session)")

    def test_course_organizations_copied_when_publishing(self):
        """
        When publishing a course, the links to draft organizations on the draft version of the
        course should be copied (clear then add) to the published version.
        Links to published organizations should not be copied as they are redundant and not
        up-to-date.
        """
        # Create draft organizations
        organization1, organization2 = OrganizationFactory.create_batch(2)

        # Create a draft course
        draft_course = CourseFactory(with_organizations=[organization1, organization2])

        # Publish organization1
        organization1.extended_object.publish("en")
        organization1.refresh_from_db()

        # The course should see all organizations and propose a custom filter to easily access
        # the draft versions
        self.assertEqual(
            set(draft_course.organizations.all()),
            {
                organization1,
                organization1.public_extension,
                organization2,
                draft_course.organization_main,
            },
        )
        self.assertEqual(
            set(draft_course.organizations.drafts()),
            {organization1, organization2, draft_course.organization_main},
        )

        # Publish the course and check that the organizations are copied
        draft_course.extended_object.publish("en")
        published_course = Course.objects.get(extended_object__publisher_is_draft=False)
        self.assertEqual(
            set(published_course.organizations.all()),
            {organization1, organization2, draft_course.organization_main},
        )
        # When publishing, the organizations that are obsolete should be cleared
        draft_course.organizations.remove(organization2)
        self.assertEqual(
            set(published_course.organizations.all()),
            {organization1, organization2, draft_course.organization_main},
        )
        # Organizations on the published course are only cleared after publishing the draft page
        draft_course.extended_object.publish("en")
        self.assertEqual(
            set(published_course.organizations.all()),
            {organization1, draft_course.organization_main},
        )

    def test_course_subjects_copied_when_publishing(self):
        """
        When publishing a course, the links to draft subjects on the draft version of the
        course should be copied (clear then add) to the published version.
        Links to published subjects should not be copied as they are redundant and not
        up-to-date.
        """
        # Create draft subjects
        subject1, subject2 = SubjectFactory.create_batch(2)

        # Create a draft course
        draft_course = CourseFactory(with_subjects=[subject1, subject2])

        # Publish subject1
        subject1.extended_object.publish("en")
        subject1.refresh_from_db()

        # The draft course should see all subjects and propose a custom filter to easily access
        # the draft versions
        self.assertEqual(
            set(draft_course.subjects.all()),
            {subject1, subject1.public_extension, subject2},
        )
        self.assertEqual(set(draft_course.subjects.drafts()), {subject1, subject2})

        # Publish the course and check that the subjects are copied
        draft_course.extended_object.publish("en")
        published_course = Course.objects.get(extended_object__publisher_is_draft=False)
        self.assertEqual(set(published_course.subjects.all()), {subject1, subject2})

        # When publishing, the subjects that are obsolete should be cleared
        draft_course.subjects.remove(subject2)
        self.assertEqual(set(published_course.subjects.all()), {subject1, subject2})

        # Subjects on the published course are only cleared after publishing the draft page
        draft_course.extended_object.publish("en")
        self.assertEqual(set(published_course.subjects.all()), {subject1})
