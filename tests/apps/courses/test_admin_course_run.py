"""
Test suite defining the admin pages for the CourseRun model
"""

import random
from datetime import datetime, timezone

from django.test.utils import override_settings
from django.urls import reverse
from django.utils import timezone as django_timezone

from cms.models import GlobalPagePermission, PagePermission
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import Course, CourseRun

# pylint: disable=too-many-public-methods


class CourseRunAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the CourseRun model
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
        self.assertContains(response, "id_title", count=2)
        self.assertContains(response, "id_resource_link", count=2)
        self.assertContains(response, "id_start_", count=2)
        self.assertContains(response, "id_end_", count=2)
        self.assertContains(response, "id_enrollment_start_", count=2)
        self.assertContains(response, "id_enrollment_end_", count=2)
        self.assertContains(response, "id_languages", count=3)
        self.assertContains(response, "id_enrollment_count", count=3)
        self.assertContains(response, "id_sync_mode", count=2)

    # List

    def test_admin_course_run_list_view_anonymous(self):
        """
        Anonymous users should not be allowed to access the change list view.
        """
        CourseRunFactory()

        # Get the admin list view
        url = reverse("admin:courses_courserun_changelist")
        response = self.client.get(url, follow=True)

        # Check that the user is redirected to the login page
        self.assertContains(
            response, "<title>Log in | Django site admin</title>", html=True
        )

    def test_admin_course_run_list_view_superuser(self):
        """
        The admin list view of course runs should only show the id field.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a course run linked to a page
        course = CourseFactory()
        course_run = CourseRunFactory(direct_course=course)
        course.extended_object.publish("en")
        self.assertEqual(CourseRun.objects.count(), 2)

        # Get the admin list view
        url = reverse("admin:courses_courserun_changelist")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that only the id field is displayed
        self.assertContains(response, "field-id", 2)
        self.assertContains(response, "field-", 2)

        # Check that the page includes both course run
        self.assertContains(
            response, '<p class="paginator">2 course runs</p>', html=True
        )

        change_url_draft = reverse(
            "admin:courses_courserun_change", args=[course_run.id]
        )
        self.assertContains(response, change_url_draft)

        change_url_public = reverse(
            "admin:courses_courserun_change", args=[course_run.public_course_run.id]
        )
        self.assertContains(response, change_url_public)

    def test_admin_course_run_list_view_staff(self):
        """
        On the course run change list view, staff users can see all draft course runs
        whether they have related page permissions or not.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Create course runs each linked to their page
        course_run1 = CourseRunFactory()
        course_run2 = CourseRunFactory()

        # Create the required permissions only for the first course run
        self.add_permission(user, "change_courserun")
        self.add_permission(user, "change_page")
        PagePermission.objects.create(
            page=course_run1.direct_course.extended_object,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        # Get the admin list view
        url = reverse("admin:courses_courserun_changelist")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that the page includes only the first course run
        self.assertContains(
            response, '<p class="paginator">2 course runs</p>', html=True
        )
        change_url1 = reverse("admin:courses_courserun_change", args=[course_run1.id])
        self.assertContains(response, change_url1)
        change_url2 = reverse("admin:courses_courserun_change", args=[course_run2.id])
        self.assertContains(response, change_url2)

        # Same if the CMS permissions are not activated
        with override_settings(CMS_PERMISSION=False):
            response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that the page includes both course runs
        self.assertContains(
            response, '<p class="paginator">2 course runs</p>', html=True
        )
        change_url1 = reverse("admin:courses_courserun_change", args=[course_run1.id])
        self.assertContains(response, change_url1)
        change_url2 = reverse("admin:courses_courserun_change", args=[course_run2.id])
        self.assertContains(response, change_url2)

    # Get

    def test_admin_course_run_change_view_get_anonymous(self):
        """
        Anonymous users should not be allowed to view course runs via the admin.
        """
        course_run = CourseRunFactory()

        # Get the admin change view
        url = reverse("admin:courses_courserun_change", args=[course_run.id])
        response = self.client.get(url, follow=True)

        # Check that the user is redirected to the login page
        self.assertContains(
            response, "<title>Log in | Django site admin</title>", html=True
        )

    def test_admin_course_run_change_view_get_superuser_draft(self):
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
        self.assertContains(response, "id_start_", count=2)
        self.assertContains(response, "id_end_", count=2)
        self.assertContains(response, "id_enrollment_start_", count=2)
        self.assertContains(response, "id_enrollment_end_", count=2)
        self.assertContains(response, "id_languages", count=3)
        self.assertContains(response, "id_enrollment_count", count=3)
        self.assertContains(response, "id_sync_mode", count=2)

    def test_admin_course_run_change_view_get_superuser_public(self):
        """Public course runs should not render a change view."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a public course run
        course = CourseFactory()
        CourseRunFactory(direct_course=course)
        course.extended_object.publish("en")

        self.assertEqual(CourseRun.objects.count(), 2)
        public_course_run = CourseRun.objects.get(draft_course_run__isnull=False)

        # Get the admin change view
        url = reverse("admin:courses_courserun_change", args=[public_course_run.id])
        response = self.client.get(url, follow=True)

        self.assertEqual(response.status_code, 403)

    def test_admin_course_run_change_view_get_staff_missing_model_permission(self):
        """
        Staff users missing permissions should not be allowed to view a course run's change view.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        course_run = CourseRunFactory()

        # Create the required model permissions except one
        missing = random.randint(0, 1)
        if missing != 0:
            self.add_permission(user, "change_courserun")
        if missing != 1:
            self.add_permission(user, "change_page")

        # Create the object permission on the course page
        PagePermission.objects.create(
            page=course_run.direct_course.extended_object,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        # Get the admin change view
        url = reverse("admin:courses_courserun_change", args=[course_run.id])
        response = self.client.get(url, follow=True)

        self.assertEqual(response.status_code, 403)

    def test_admin_course_run_change_view_get_staff_missing_object_permission(self):
        """
        Staff users missing permissions should not be allowed to view a course run's change view.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        course_run = CourseRunFactory()

        # Create the required model permissions but not the page permission
        self.add_permission(user, "change_courserun")
        self.add_permission(user, "change_page")

        # Get the admin change view
        url = reverse("admin:courses_courserun_change", args=[course_run.id])
        response = self.client.get(url, follow=True)

        self.assertEqual(response.status_code, 403)

    def test_admin_course_run_change_view_get_staff_all_permissions(self):
        """
        Staff users with all permissions should be allowed to view a course run's change view.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        course_run = CourseRunFactory()

        # Create the required permissions
        self.add_permission(user, "change_courserun")
        self.add_permission(user, "change_page")
        PagePermission.objects.create(
            page=course_run.direct_course.extended_object,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        # Get the admin change view
        url = reverse("admin:courses_courserun_change", args=[course_run.id])
        response = self.client.get(url, follow=True)

        # Check that the page includes the page title
        self.assertContains(response, course_run.title, status_code=200)

        # Check that the page includes all our fields
        self.assertContains(response, "id_title", count=2)
        self.assertContains(response, "id_resource_link", count=2)
        self.assertContains(response, "id_start_", count=2)
        self.assertContains(response, "id_end_", count=2)
        self.assertContains(response, "id_enrollment_start_", count=2)
        self.assertContains(response, "id_enrollment_end_", count=2)
        self.assertContains(response, "id_languages", count=3)
        self.assertContains(response, "id_enrollment_count", count=3)
        self.assertContains(response, "id_sync_mode", count=2)

    # Add

    def _prepare_add_view_post(self, course, status_code):
        """Helper method to test the add view."""
        url = reverse("admin:courses_courserun_add")
        data = {
            "direct_course": course.id,
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
            "catalog_visibility": "course_and_search",
            "offer": "free",
            "price": 0.0,
            "sync_mode": "manual",
            "display_mode": "detailed",
        }
        with django_timezone.override(timezone.utc):
            response = self.client.post(url, data, follow=True)
        self.assertEqual(response.status_code, status_code)

        return response

    def test_admin_course_run_add_view_post_anonymous(self):
        """
        Anonymous users should not be allowed to add course runs via the admin.
        """
        course = CourseFactory()

        response = self._prepare_add_view_post(course, 200)
        self.assertFalse(CourseRun.objects.exists())
        self.assertContains(
            response, "<title>Log in | Django site admin</title>", html=True
        )

    def test_admin_course_run_add_view_post_superuser_draft(self):
        """
        Validate that the draft course run can be created via the admin.
        """
        course = CourseFactory()

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        response = self._prepare_add_view_post(course, 200)

        self.assertTrue(CourseRun.objects.exists())
        self.assertContains(response, "successful")

    def test_admin_course_run_add_view_post_staff_user_missing_permission(self):
        """
        Staff users with missing page permissions can not add a course run via the admin
        unless CMS permissions are not activated.
        """
        course = CourseFactory()

        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add only model permissions, not page permission on the course page
        self.add_permission(user, "add_courserun")
        self.add_permission(user, "change_page")

        response = self._prepare_add_view_post(course, 200)
        self.assertContains(
            response, "You do not have permission to change this course page."
        )
        self.assertFalse(CourseRun.objects.exists())

        # But it should work if CMS permissions are not activated
        with override_settings(CMS_PERMISSION=False):
            self._prepare_add_view_post(course, 200)
        self.assertTrue(CourseRun.objects.exists())

    def test_admin_course_run_add_view_post_staff_user_page_permission(self):
        """Staff users with all necessary permissions can add a course run via the admin."""
        course = CourseFactory()

        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add all necessary model and object level permissions
        self.add_permission(user, "add_courserun")
        self.add_permission(user, "change_page")
        PagePermission.objects.create(
            page=course.extended_object,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        response = self._prepare_add_view_post(course, 200)
        self.assertTrue(CourseRun.objects.exists())
        self.assertContains(response, "successful")

    # Change

    def _prepare_change_view_post(self, course_run, course, status_code, check_method):
        """Helper method to test the change view."""
        url = reverse("admin:courses_courserun_change", args=[course_run.id])
        data = {
            "direct_course": course.id,
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
            "enrollment_count": "5",
            "catalog_visibility": "course_and_search",
            "offer": "free",
            "price": 0.0,
            "sync_mode": "manual",
            "display_mode": "detailed",
        }
        with django_timezone.override(timezone.utc):
            response = self.client.post(url, data, follow=True)
        self.assertEqual(response.status_code, status_code)

        # Check that the course run was updated as expected
        course_run.refresh_from_db()
        check_method(course_run.direct_course, course)
        check_method(course_run.title, "My title")
        check_method(course_run.languages, ["fr", "en"])
        check_method(course_run.resource_link, "https://example.com/my-resource-link")
        check_method(
            course_run.start, datetime(2015, 1, 15, 7, 6, 15, tzinfo=timezone.utc)
        )
        check_method(
            course_run.end, datetime(2015, 1, 30, 23, 52, 34, tzinfo=timezone.utc)
        )
        check_method(
            course_run.enrollment_start,
            datetime(2015, 1, 2, 13, 13, 7, tzinfo=timezone.utc),
        )
        check_method(
            course_run.enrollment_end,
            datetime(2015, 1, 23, 9, 7, 11, tzinfo=timezone.utc),
        )
        check_method(course_run.enrollment_count, 5)
        check_method(course_run.sync_mode, "manual")
        return response

    def test_admin_course_run_change_view_post_anonymous(self):
        """
        Anonymous users should not be allowed to update course runs via the admin.
        """
        course_run = CourseRunFactory()
        snapshot = CourseFactory(page_parent=course_run.direct_course.extended_object)

        response = self._prepare_change_view_post(
            course_run, snapshot, 200, self.assertNotEqual
        )
        self.assertContains(
            response, "<title>Log in | Django site admin</title>", html=True
        )

    def test_admin_course_run_change_view_post_superuser_draft(self):
        """
        Validate that the draft course run can be updated via the admin.
        """
        course_run = CourseRunFactory()
        snapshot = CourseFactory(page_parent=course_run.direct_course.extended_object)

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        self._prepare_change_view_post(course_run, snapshot, 200, self.assertEqual)

    def test_admin_course_run_change_view_post_superuser_public(self):
        """
        Validate that the public course run can not be updated via the admin.
        """
        course_run = CourseRunFactory()
        snapshot = CourseFactory(page_parent=course_run.direct_course.extended_object)
        course_run.direct_course.extended_object.publish("en")
        course_run.refresh_from_db()

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        self._prepare_change_view_post(
            course_run.public_course_run, snapshot, 403, self.assertNotEqual
        )

    def test_admin_course_run_change_view_post_staff_user_missing_permission(self):
        """
        Staff users with missing page permissions can not update a course run via the admin
        unless CMS permissions are not activated.
        """
        course_run = CourseRunFactory()
        snapshot = CourseFactory(page_parent=course_run.direct_course.extended_object)

        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add only model permissions, not page permission on the course page
        self.add_permission(user, "add_courserun")
        self.add_permission(user, "change_courserun")
        self.add_permission(user, "change_page")

        self._prepare_change_view_post(course_run, snapshot, 403, self.assertNotEqual)

        # But it should work if CMS permissions are not activated
        with override_settings(CMS_PERMISSION=False):
            self._prepare_change_view_post(course_run, snapshot, 200, self.assertEqual)

    def test_admin_course_run_change_view_post_staff_user_page_permission(self):
        """Staff users with all necessary permissions can update a course run via the admin."""
        course_run = CourseRunFactory()
        snapshot = CourseFactory(page_parent=course_run.direct_course.extended_object)

        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add all necessary model and object level permissions
        self.add_permission(user, "add_courserun")
        self.add_permission(user, "change_courserun")
        self.add_permission(user, "change_page")
        PagePermission.objects.create(
            page=course_run.direct_course.extended_object,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        self._prepare_change_view_post(course_run, snapshot, 200, self.assertEqual)

    def test_admin_course_run_change_view_post_staff_user_global_page_permission(self):
        """
        Staff users missing page permissions can still update the course run if the
        global permissions allow it.
        """
        course_run = CourseRunFactory()
        snapshot = CourseFactory(page_parent=course_run.direct_course.extended_object)

        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add all necessary model and object level permissions
        self.add_permission(user, "add_courserun")
        self.add_permission(user, "change_courserun")
        self.add_permission(user, "change_page")
        GlobalPagePermission.objects.create(
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        self._prepare_change_view_post(course_run, snapshot, 200, self.assertEqual)

    # Delete

    def _prepare_delete(self, course_run, status_code, check_method):
        """Helper method to test the delete view."""
        url = reverse("admin:courses_courserun_delete", args=[course_run.id])

        response = self.client.post(url, {"post": "yes"}, follow=True)
        self.assertEqual(response.status_code, status_code)

        # Check whether the course run was deleted
        check_method(CourseRun.objects.filter(id=course_run.id).exists())
        return response

    def test_admin_course_run_delete_anonymous(self):
        """
        Anonymous users should not be allowed to delete course runs via the admin.
        """
        course_run = CourseRunFactory()
        response = self._prepare_delete(course_run, 200, self.assertTrue)

        # Anonymous users are redirected to the login form
        self.assertContains(
            response, "<title>Log in | Django site admin</title>", html=True
        )

    def test_admin_course_run_delete_superuser_draft(self):
        """
        Validate that the draft course run can be deleted via the admin and that
        it deletes the associated public course run.
        """
        course_run = CourseRunFactory()
        course_run.direct_course.extended_object.publish("en")
        course_run.refresh_from_db()
        self.assertEqual(CourseRun.objects.count(), 2)

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        response = self._prepare_delete(course_run, 200, self.assertFalse)
        self.assertEqual(Course.objects.count(), 2)
        self.assertContains(response, "was deleted successfully")

    def test_admin_course_run_delete_superuser_public(self):
        """
        Validate that the public course run can not be deleted via the admin.
        """
        course_run = CourseRunFactory()
        course_run.direct_course.extended_object.publish("en")
        course_run.refresh_from_db()

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        self._prepare_delete(course_run.public_course_run, 200, self.assertFalse)

    def test_admin_course_run_delete_staff_user_missing_permission(self):
        """
        Staff users with missing page permissions can not delete a course run via the admin
        unless CMS permissions are not activated.
        """
        course_run = CourseRunFactory()

        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add only model permissions, not page permission on the course page
        self.add_permission(user, "delete_courserun")
        self.add_permission(user, "change_page")

        self._prepare_delete(course_run, 403, self.assertTrue)

        # But it should work if CMS permissions are not activated
        with override_settings(CMS_PERMISSION=False):
            self._prepare_delete(course_run, 200, self.assertFalse)

        # The course object should not be deleted
        self.assertEqual(Course.objects.count(), 1)

    def test_admin_course_run_delete_staff_user_page_permission(self):
        """Staff users with all necessary permissions can delete a course run via the admin."""
        course_run = CourseRunFactory()
        course_run.direct_course.extended_object.publish("en")
        course_run.refresh_from_db()

        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add all necessary model and object level permissions
        self.add_permission(user, "delete_courserun")
        self.add_permission(user, "change_page")
        PagePermission.objects.create(
            page=course_run.direct_course.extended_object,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        self._prepare_delete(course_run, 200, self.assertFalse)
