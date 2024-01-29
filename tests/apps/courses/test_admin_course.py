"""
Test suite defining the admin pages for the Course model
"""

from django.urls import reverse

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseFactory


class CourseAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Course model
    """

    def test_admin_course_index(self):
        """Courses should not be listed on the index as they are page extensions."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin index view
        url = reverse("admin:index")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that a link to the course list view is not on the page
        course_url = reverse("admin:courses_course_changelist")
        self.assertNotContains(response, course_url)

    def test_admin_course_list_view(self):
        """
        The admin list view of courses should display the title of the related page.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course linked to a page
        course = CourseFactory()

        # Get the admin list view
        url = reverse("admin:courses_course_changelist")
        response = self.client.get(url, follow=True)

        # Check that the page includes the title field
        self.assertContains(
            response, course.extended_object.get_title(), status_code=200
        )

    def test_admin_course_add_view(self):
        """
        The admin add view should work for courses.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:courses_course_add")
        self.client.get(url, follow=True)

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

        # Get the admin change view
        url = reverse("admin:courses_course_change", args=[course.id])
        response = self.client.get(url)

        # Check that the page includes the title field
        self.assertContains(
            response, course.extended_object.get_title(), status_code=200
        )
