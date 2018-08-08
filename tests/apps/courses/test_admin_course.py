"""
Test suite defining the admin pages for the Course model
"""
from django.core.urlresolvers import reverse

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    CourseFactory,
    OrganizationFactory,
    SubjectFactory,
)


class CourseAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Course model
    """

    def test_admin_course_list_view(self):
        """
        The admin list view of courses should display their active session, their
        organization_main and the title of the related page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course linked to a page
        course = CourseFactory()

        # Get the admin list view
        url = reverse("admin:courses_course_changelist")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our fields
        self.assertContains(
            response, course.extended_object.get_title(), status_code=200
        )
        self.assertContains(
            response, course.organization_main.extended_object.get_title()
        )
        self.assertContains(response, course.active_session)

    def test_admin_course_add_view(self):
        """
        The admin add view should work for courses
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:courses_course_add")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our editable fields
        for field in ["active_session", "organization_main"]:
            self.assertContains(response, "id_{:s}".format(field))

    def test_admin_course_change_view_get(self):
        """
        The admin change view should include the editable and readonly fields as expected.
        In particular, the relation fields should only include options for related objects in
        their draft version.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course
        course = CourseFactory()

        # Create an organization and publish it
        organization = OrganizationFactory()
        organization.extended_object.publish("en")
        organization.refresh_from_db()

        # Create a subject and publish it
        subject = SubjectFactory()
        subject.extended_object.publish("en")
        subject.refresh_from_db()

        # Get the admin change view
        url = reverse("admin:courses_course_change", args=[course.id])
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(
            response, course.extended_object.get_title(), status_code=200
        )
        self.assertContains(response, course.active_session)
        self.assertContains(
            response, course.organization_main.extended_object.get_title()
        )
        # Only the draft organization and subject should be proposed as options in select boxes
        self.assertContains(
            response, '<option value="{:d}">{!s}'.format(subject.id, subject)
        )
        self.assertNotContains(
            response,
            '<option value="{:d}">{!s}'.format(
                subject.public_extension.id, subject.public_extension
            ),
        )
        self.assertContains(
            response, '<option value="{:d}">{!s}'.format(organization.id, organization)
        )
        self.assertNotContains(
            response,
            '<option value="{:d}">{!s}'.format(
                organization.public_extension.id, organization.public_extension
            ),
        )

    def test_admin_course_change_view_post(self):
        """
        Validate that the course can be updated via the admin.
        In particular, make sure that when a course is updated from the admin, the main
        organization is automatically added to the many-to-many field "organizations".
        See http://stackoverflow.com/a/1925784/469575 for details on the issue.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course, some organizations and some subjects
        organization1, organization2, organization3 = OrganizationFactory.create_batch(
            3
        )
        subject1, subject2 = SubjectFactory.create_batch(2)
        course = CourseFactory(
            with_organizations=[organization1], with_subjects=[subject1]
        )
        self.assertEqual(
            set(course.organizations.all()), {organization1, course.organization_main}
        )
        self.assertEqual(set(course.subjects.all()), {subject1})

        # Get the admin change view
        url = reverse("admin:courses_course_change", args=[course.id])
        data = {
            "active_session": "xyz",
            "organization_main": organization2.id,
            "organizations": [organization3.id],
            "subjects": [subject2.id],
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)

        # Check that the course was updated as expected
        course.refresh_from_db()
        self.assertEqual(course.active_session, "xyz")
        self.assertEqual(course.organization_main, organization2)
        self.assertEqual(set(course.subjects.all()), {subject2})
        # Check that the main organization was added and the old organization cleared
        self.assertEqual(
            set(course.organizations.all()), {organization2, organization3}
        )
