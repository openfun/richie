"""
Test suite defining the admin pages for the Course model
"""
from datetime import datetime

from django.urls import reverse
from django.utils import timezone

import pytz
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseFactory, CourseRunFactory


class CourseRunAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Course model
    """

    def test_admin_course_run_index(self):
        """
        Course runs should not be listed on the index and should be handled via frontend editing.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin index view
        url = reverse("admin:index")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that there is no link to the course run list view
        course_run_url = reverse("admin:courses_courserun_changelist")
        self.assertNotContains(response, course_run_url)

    def test_admin_course_run_list_view(self):
        """
        The admin list view of course runs should display the title of the related page.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course run linked to a page
        course_run = CourseRunFactory()

        # Get the admin list view
        url = reverse("admin:courses_courserun_changelist")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that the page includes the course run
        self.assertContains(response, course_run.title)
        self.assertContains(response, course_run.resource_link)

    def test_admin_course_run_add_view(self):
        """
        The admin add view should work for course runs.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:courses_courserun_add")
        response = self.client.get(url, follow=True)

        # Check that the page includes all our fields
        self.assertContains(response, "id_resource_link")
        self.assertContains(response, "id_start_", count=3)
        self.assertContains(response, "id_end_", count=3)
        self.assertContains(response, "id_enrollment_start_", count=3)
        self.assertContains(response, "id_enrollment_end_", count=3)

    def test_admin_course_run_change_view_get(self):
        """
        The admin change view should include the editable and readonly fields as expected.
        In particular, the relation fields should only include options for related objects in
        their draft version.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course run
        course_run = CourseRunFactory()

        # Get the admin change view
        url = reverse("admin:courses_courserun_change", args=[course_run.id])
        response = self.client.get(url)

        # Check that the page includes the page title
        self.assertContains(response, course_run.title, status_code=200)

        # Check that the page includes all our fields
        self.assertContains(response, "id_title", count=2)
        self.assertContains(response, "id_resource_link", count=2)
        self.assertContains(response, "id_start_", count=3)
        self.assertContains(response, "id_end_", count=3)
        self.assertContains(response, "id_enrollment_start_", count=3)
        self.assertContains(response, "id_enrollment_end_", count=3)
        self.assertContains(response, "id_languages", count=2)

    def test_admin_course_run_change_view_post(self):
        """
        Validate that the course run can be updated via the admin.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course run
        course_run = CourseRunFactory()

        # A course run can be moved to its course's snapshot
        snapshot = CourseFactory(page_parent=course_run.direct_course.extended_object)

        # Get the admin change view
        url = reverse("admin:courses_courserun_change", args=[course_run.id])
        data = {
            "direct_course": snapshot.id,
            "title": "My title",
            "languages": ["fr", "en"],
            "resource_link": "https://example.com/my-resource-link",
            "start_0": "2015-01-15",
            "start_1": "07:06:15",
            "end_0": "2015-01-30",
            "end_1": "23:52:34",
            "enrollment_start_0": "2015-01-02",
            "enrollment_start_1": "13:13:07",
            "enrollment_end_0": "2015-01-23",
            "enrollment_end_1": "09:07:11",
        }
        with timezone.override(pytz.utc):
            response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)

        # Check that the course run was updated as expected
        course_run.refresh_from_db()
        self.assertEqual(course_run.direct_course, snapshot)
        self.assertEqual(course_run.title, "My title")
        self.assertEqual(course_run.languages, ["fr", "en"])
        self.assertEqual(
            course_run.resource_link, "https://example.com/my-resource-link"
        )
        self.assertEqual(
            course_run.start, datetime(2015, 1, 15, 7, 6, 15, tzinfo=pytz.utc)
        )
        self.assertEqual(
            course_run.end, datetime(2015, 1, 30, 23, 52, 34, tzinfo=pytz.utc)
        )
        self.assertEqual(
            course_run.enrollment_start,
            datetime(2015, 1, 2, 13, 13, 7, tzinfo=pytz.utc),
        )
        self.assertEqual(
            course_run.enrollment_end, datetime(2015, 1, 23, 9, 7, 11, tzinfo=pytz.utc)
        )
