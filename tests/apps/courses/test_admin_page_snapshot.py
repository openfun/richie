"""
Test suite defining the admin pages for the Course model
"""

import json
import random
from datetime import datetime
from unittest import mock

from django.test.utils import override_settings
from django.utils import timezone

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import Course, CourseRun


@override_settings(LANGUAGES=(("en", "En"), ("fr", "Fr"), ("de", "De")))
@override_settings(CMS_LANGUAGES={})  # Ensure not set so LANGUAGES setting is used
class SnapshotPageAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of course snapshots.
    """

    def test_admin_page_snapshot_with_cms_permissions(self):
        """
        Confirm the creation of a snapshot works as expected:
        - snapshot title and slug are set to a timestamp,
        - publication status of the course is respected on the snapshot,
        - course runs are moved below the snapshot,
        - publication status of course runs is respected,
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Create a course page (not published in german)
        course = CourseFactory(
            page_title={"en": "a course", "fr": "un cours", "de": "ein Kurs"}
        )
        # Create a course run for this course
        course_run = CourseRunFactory(direct_course=course)

        self.assertTrue(course.extended_object.publish("en"))
        self.assertTrue(course.extended_object.publish("fr"))

        # It should have copied the course run to the published page
        self.assertEqual(CourseRun.objects.count(), 2)

        # Add the necessary permissions (global and per page)
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")
        self.add_page_permission(
            user, course.extended_object, can_change=True, can_add=True
        )

        # Trigger the creation of a snapshot for the course
        url = f"/en/admin/courses/course/{course.id:d}/snapshot/"
        now = datetime(2010, 1, 1, tzinfo=timezone.utc)
        with mock.patch.object(timezone, "now", return_value=now):
            response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(Course.objects.count(), 4)
        self.assertEqual(CourseRun.objects.count(), 2)

        snapshot = (
            Course.objects.exclude(id=course.id)
            .exclude(public_extension__isnull=True)
            .get()
        )
        self.assertEqual(content, {"id": snapshot.id})

        # The snapshot title and slug should include the version with datetime of snapshot
        expected_titles = {
            "en": "a course (Archived on 2010-01-01 00:00:00)",
            "fr": "un cours (Archived on 2010-01-01 00:00:00)",
            "de": "ein Kurs (Archived on 2010-01-01 00:00:00)",
        }
        for language in ["en", "fr", "de"]:
            self.assertEqual(
                snapshot.extended_object.get_title(language), expected_titles[language]
            )
            self.assertEqual(
                snapshot.extended_object.get_slug(language),
                "archived-on-2010-01-01-000000",
            )

        # The publication status of the course should be respected on the snapshot
        self.assertTrue(snapshot.check_publication("en"))
        self.assertTrue(snapshot.check_publication("fr"))
        self.assertFalse(snapshot.check_publication("de"))

        # The course run should have moved below the snapshot
        self.assertEqual(CourseRun.objects.count(), 2)
        course_run.refresh_from_db()
        self.assertEqual(course_run.direct_course, snapshot)

    def test_admin_page_snapshot_page_permissions_not_granted(self):
        """
        When CMS permissions are activated, snapshot should be forbidden if page permissions
        are not granted.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Create a course page
        course = CourseFactory(should_publish=True)

        # Add global permissions only
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")

        # Trigger the creation of a snapshot for the course
        url = f"/en/admin/courses/course/{course.id:d}/snapshot/"
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.content,
            b"You don't have sufficient permissions to snapshot this page.",
        )
        # No additional courses should have been created
        self.assertEqual(Course.objects.count(), 2)

    def test_admin_page_snapshot_global_permissions_not_granted(self):
        """
        Snapshot should be forbidden if global permissions are not granted.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Create a course page
        course = CourseFactory(should_publish=True)

        # Add page permissions only
        self.add_page_permission(
            user, course.extended_object, can_change=True, can_add=True
        )

        # Trigger the creation of a snapshot for the course
        url = f"/en/admin/courses/course/{course.id:d}/snapshot/"
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.content,
            b"You don't have sufficient permissions to snapshot this page.",
        )
        # No additional courses should have been created
        self.assertEqual(Course.objects.count(), 2)

    @override_settings(CMS_PERMISSION=False)
    def test_admin_page_snapshot_cms_permissions_deactivated(self):
        """
        If the CMS permissions are not activated, general permissions should suffice.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Create a course page
        course = CourseFactory(should_publish=True)

        # Add global permissions only
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")

        # Trigger the creation of a snapshot for the course
        url = f"/en/admin/courses/course/{course.id:d}/snapshot/"
        with mock.patch("time.time", mock.MagicMock(return_value=1541946888)):
            response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        snapshot = (
            Course.objects.exclude(id=course.id)
            .exclude(public_extension__isnull=True)
            .get()
        )
        self.assertEqual(content, {"id": snapshot.id})

    @override_settings(CMS_PERMISSION=False)
    def test_admin_page_snapshot_cms_permissions_deactivated_no_permissions(self):
        """
        Snapshot should not be allowed if the CMS permissions are not activated and no
        permissions are granted.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Create a course page
        course = CourseFactory(should_publish=True)

        # One or both of the permissions are deactivated
        can_add_page = random.choice([True, False])
        if can_add_page:
            self.add_permission(user, "add_page")
        if not can_add_page and random.choice([True, False]):
            self.add_permission(user, "change_page")

        # Trigger the creation of a snapshot for the course
        url = f"/en/admin/courses/course/{course.id:d}/snapshot/"
        with mock.patch("time.time", mock.MagicMock(return_value=1541946888)):
            response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.content,
            b"You don't have sufficient permissions to snapshot this page.",
        )
        # No additional courses should have been created
        self.assertEqual(Course.objects.count(), 2)

    def test_admin_page_snapshot_post_required(self):
        """
        Snapshots can only be triggered with a POST method.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Create a course page
        course = CourseFactory(should_publish=True)

        # Add the necessary permissions (global and per page)
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")
        self.add_page_permission(
            user, course.extended_object, can_change=True, can_add=True
        )

        # Try triggering the snapshot with other methods
        url = f"/en/admin/courses/course/{course.id:d}/snapshot/"

        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 405)

        response = self.client.put(url, follow=True)
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(url, follow=True)
        self.assertEqual(response.status_code, 405)

    def test_admin_page_snapshot_forbidden_for_snapshots(self):
        """
        It should not be allowed to snapshot a course snapshot.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        course = CourseFactory()
        snapshot = CourseFactory(page_parent=course.extended_object)

        # Add the necessary permissions (global and per page)
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")
        self.add_page_permission(
            user, snapshot.extended_object, can_change=True, can_add=True
        )

        # Try triggering the creation of a snapshot for the snapshot
        url = f"/en/admin/courses/course/{snapshot.id:d}/snapshot/"
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.content, b"You can't snapshot a snapshot.")

    def test_admin_page_snapshot_blocked_for_public_page(self):
        """
        It should not be possible to snapshot the public page of a course.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        public_course = CourseFactory(should_publish=True).public_extension

        # Add the necessary permissions (global and per page)
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")
        self.add_page_permission(
            user, public_course.extended_object, can_change=True, can_add=True
        )

        # Try triggering the creation of a snapshot for the course
        url = f"/en/admin/courses/course/{public_course.id:d}/snapshot/"
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content, b"Course could not be found.")

    @override_settings(CMS_PERMISSION=False)
    def test_admin_page_snapshot_unknown_page(self):
        """
        Trying to snapshot a course that does not exist should return a 400 error.
        """
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Add the necessary permissions (global and per page)
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")

        # Try triggering the creation of a snapshot for an unknown course
        url = "/en/admin/courses/course/1/snapshot/"
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content, b"Course could not be found.")
