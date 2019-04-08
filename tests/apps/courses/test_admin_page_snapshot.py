"""
Test suite defining the admin pages for the Course model
"""
import json
import random
from unittest import mock

from django.test.utils import override_settings

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
        course.extended_object.publish("en")
        course.extended_object.publish("fr")

        # Create a course run published only in English
        course_run1 = CourseRunFactory(page_parent=course.extended_object)
        course_run1.extended_object.publish("en")
        self.assertTrue(course_run1.check_publication("en"))
        self.assertFalse(course_run1.check_publication("fr"))
        self.assertFalse(course_run1.check_publication("de"))

        # Create a course run published only in French
        course_run2 = CourseRunFactory(page_parent=course.extended_object)
        course_run2.extended_object.publish("fr")
        self.assertFalse(course_run2.check_publication("en"))
        self.assertTrue(course_run2.check_publication("fr"))
        self.assertFalse(course_run2.check_publication("de"))

        # Add the necessary permissions (global and per page)
        self.add_permission(user, "add_page")
        self.add_permission(user, "change_page")
        self.add_page_permission(
            user, course.extended_object, can_change=True, can_add=True
        )

        # Trigger the creation of a snapshot for the course
        url = "/en/admin/courses/course/{:d}/snapshot/".format(course.id)
        with mock.patch("time.time", mock.MagicMock(return_value=1541946888)):
            response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(Course.objects.count(), 4)
        snapshot = (
            Course.objects.exclude(id=course.id)
            .exclude(public_extension__isnull=True)
            .get()
        )
        self.assertEqual(content, {"id": snapshot.id})

        # The snapshot title and slug should be the timestamp at the time of snapshot
        expected_titles = {
            "en": "1541946888 - Snapshot of a course",
            "fr": "1541946888 - Snapshot of un cours",
            "de": "1541946888 - Snapshot of ein Kurs",
        }
        for language in ["en", "fr", "de"]:
            self.assertEqual(
                snapshot.extended_object.get_title(language), expected_titles[language]
            )
            self.assertEqual(snapshot.extended_object.get_slug(language), "1541946888")

        # The publication status of the course should be respected on the snapshot
        self.assertTrue(snapshot.check_publication("en"))
        self.assertTrue(snapshot.check_publication("fr"))
        self.assertFalse(snapshot.check_publication("de"))

        # The course runs should have moved below the snapshot
        # and they should have kept their publication status
        self.assertEqual(CourseRun.objects.count(), 2 + 2)  # 2 drafts + 2 published

        # - course run 1 should be published only in english
        course_run1 = CourseRun.objects.get(id=course_run1.id)
        self.assertEqual(
            course_run1.extended_object.parent_page, snapshot.extended_object
        )
        self.assertTrue(course_run1.check_publication("en"))
        self.assertFalse(course_run1.check_publication("fr"))
        self.assertFalse(course_run1.check_publication("de"))

        # - course run 2 should be published only in french
        course_run2 = CourseRun.objects.get(id=course_run2.id)
        self.assertEqual(
            course_run2.extended_object.parent_page, snapshot.extended_object
        )
        self.assertFalse(course_run2.check_publication("en"))
        self.assertTrue(course_run2.check_publication("fr"))
        self.assertFalse(course_run2.check_publication("de"))

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
        url = "/en/admin/courses/course/{:d}/snapshot/".format(course.id)
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "status": 403,
                "content": "You don't have sufficient permissions to snapshot this page.",
            },
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
        url = "/en/admin/courses/course/{:d}/snapshot/".format(course.id)
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "status": 403,
                "content": "You don't have sufficient permissions to snapshot this page.",
            },
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
        url = "/en/admin/courses/course/{:d}/snapshot/".format(course.id)
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
        url = "/en/admin/courses/course/{:d}/snapshot/".format(course.id)
        with mock.patch("time.time", mock.MagicMock(return_value=1541946888)):
            response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            {
                "status": 403,
                "content": "You don't have sufficient permissions to snapshot this page.",
            },
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
        url = "/en/admin/courses/course/{:d}/snapshot/".format(course.id)

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
        url = "/en/admin/courses/course/{:d}/snapshot/".format(snapshot.id)
        response = self.client.post(url, follow=True)

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"status": 403, "content": "You can't snapshot a snapshot."}
        )

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

        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"status": 400, "content": "Course could not be found."}
        )
