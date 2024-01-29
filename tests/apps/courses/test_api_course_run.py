"""
Tests for CourseRun API endpoints in the courses app.
"""

import arrow
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseRunFactory
from richie.apps.courses.models import CourseRun
from richie.apps.courses.serializers import CourseRunSerializer


class CourseRunApiTestCase(CMSTestCase):
    """Test requests on courses app API endpoints."""

    # LIST, CREATE, UPDATE and DESTROY are not supported
    def test_list_course_runs_by_anonymous_user(self):
        """
        The course run API does not support list requests.
        """
        CourseRunFactory.create_batch(2)
        response = self.client.get("/api/v1.0/course-runs/")
        self.assertEqual(response.status_code, 403)

    def test_list_course_runs_by_logged_in_user(self):
        """
        The course run API does not support list requests.
        """
        CourseRunFactory.create_batch(2)
        self.client.force_login(UserFactory())
        response = self.client.get("/api/v1.0/course-runs/")
        self.assertEqual(response.status_code, 403)

    def test_list_course_runs_by_admin_user(self):
        """
        The course run API does not support list requests.
        """
        CourseRunFactory.create_batch(2)
        self.client.force_login(UserFactory(is_staff=True, is_superuser=True))
        response = self.client.get("/api/v1.0/course-runs/")
        self.assertEqual(response.status_code, 403)

    def test_create_course_run_by_anonymous_user(self):
        """
        The course run API does not support course run creation.
        """
        response = self.client.post(
            "/api/v1.0/course-runs/",
            {
                "resource_link": "https://example.com/course-run/",
                "start": arrow.utcnow().shift(days=-5).isoformat(),
                "end": arrow.utcnow().shift(days=+90).isoformat(),
                "enrollment_start": arrow.utcnow().shift(days=-35).isoformat(),
                "enrollment_end": arrow.utcnow().shift(days=+10).isoformat(),
                "languages": ["fr"],
            },
        )

        self.assertEqual(response.status_code, 403)

    def test_create_course_run_by_logged_in_user(self):
        """
        The course run API does not support course run creation.
        """
        self.client.force_login(UserFactory())
        response = self.client.post(
            "/api/v1.0/course-runs/",
            {
                "resource_link": "https://example.com/course-run/",
                "start": arrow.utcnow().shift(days=-5).isoformat(),
                "end": arrow.utcnow().shift(days=+90).isoformat(),
                "enrollment_start": arrow.utcnow().shift(days=-35).isoformat(),
                "enrollment_end": arrow.utcnow().shift(days=+10).isoformat(),
                "languages": ["fr"],
            },
        )

        self.assertEqual(response.status_code, 403)

    def test_create_course_run_by_admin_user(self):
        """
        The course run API does not support course run creation.
        """
        self.client.force_login(UserFactory(is_staff=True, is_superuser=True))
        response = self.client.post(
            "/api/v1.0/course-runs/",
            {
                "resource_link": "https://example.com/course-run/",
                "start": arrow.utcnow().shift(days=-5).isoformat(),
                "end": arrow.utcnow().shift(days=+90).isoformat(),
                "enrollment_start": arrow.utcnow().shift(days=-35).isoformat(),
                "enrollment_end": arrow.utcnow().shift(days=+10).isoformat(),
                "languages": ["fr"],
            },
        )

        self.assertEqual(response.status_code, 403)

    def test_update_course_run_by_anonymous_user(self):
        """
        The course run API does not support course run update.
        """
        course_run = CourseRunFactory(
            resource_link="https://example.com/old-course-run/"
        )

        response = self.client.put(
            f"/api/v1.0/course-runs/{course_run.id}/",
            {
                **CourseRunSerializer(course_run).data,
                "resource_link": "https://example.com/new-course-run/",
            },
        )

        self.assertEqual(response.status_code, 403)
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.resource_link, "https://example.com/old-course-run/"
        )

    def test_update_course_run_by_logged_in_user(self):
        """
        The course run API does not support course run update.
        """
        course_run = CourseRunFactory(
            resource_link="https://example.com/old-course-run/"
        )

        self.client.force_login(UserFactory())
        response = self.client.put(
            f"/api/v1.0/course-runs/{course_run.id}/",
            {
                **CourseRunSerializer(course_run).data,
                "resource_link": "https://example.com/new-course-run/",
            },
        )

        self.assertEqual(response.status_code, 403)
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.resource_link, "https://example.com/old-course-run/"
        )

    def test_update_course_run_by_admin_user(self):
        """
        The course run API does not support course run update.
        """
        course_run = CourseRunFactory(
            resource_link="https://example.com/old-course-run/"
        )

        self.client.force_login(UserFactory(is_staff=True, is_superuser=True))
        response = self.client.put(
            f"/api/v1.0/course-runs/{course_run.id}/",
            {
                **CourseRunSerializer(course_run).data,
                "resource_link": "https://example.com/new-course-run/",
            },
        )

        self.assertEqual(response.status_code, 403)
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.resource_link, "https://example.com/old-course-run/"
        )

    def test_destroy_course_run_by_anonymous_user(self):
        """
        The course run API does not support course run deletion.
        """
        course_run = CourseRunFactory()
        self.assertEqual(CourseRun.objects.count(), 1)

        response = self.client.delete(
            f"/api/v1.0/course-runs/{course_run.id}/",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(CourseRun.objects.count(), 1)

    def test_destroy_course_run_by_logged_in_user(self):
        """
        The course run API does not support course run deletion.
        """
        course_run = CourseRunFactory()
        self.assertEqual(CourseRun.objects.count(), 1)

        self.client.force_login(UserFactory())
        response = self.client.delete(
            f"/api/v1.0/course-runs/{course_run.id}/",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(CourseRun.objects.count(), 1)

    def test_destroy_course_run_by_admin_user(self):
        """
        The course run API does not support course run deletion.
        """
        course_run = CourseRunFactory()
        self.assertEqual(CourseRun.objects.count(), 1)

        self.client.force_login(UserFactory(is_staff=True, is_superuser=True))
        response = self.client.delete(
            f"/api/v1.0/course-runs/{course_run.id}/",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(CourseRun.objects.count(), 1)

    # RETRIEVE is supported for all users
    def test_retrieve_course_run_by_anonymous_user(self):
        """
        Any user, including an anonymous user, can retrieve a single course run.
        """
        course_run = CourseRunFactory(
            start=arrow.utcnow().shift(days=-5).datetime,
            end=arrow.utcnow().shift(days=+90).datetime,
            enrollment_start=arrow.utcnow().shift(days=-35).datetime,
            enrollment_end=arrow.utcnow().shift(days=+10).datetime,
        )

        response = self.client.get(f"/api/v1.0/course-runs/{course_run.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], course_run.id)

    def test_retrieve_course_run_by_logged_in_user(self):
        """
        Logged-in users can retrieve a single course run.
        """
        course_run = CourseRunFactory(
            start=arrow.utcnow().shift(days=-5).datetime,
            end=arrow.utcnow().shift(days=+90).datetime,
            enrollment_start=arrow.utcnow().shift(days=-35).datetime,
            enrollment_end=arrow.utcnow().shift(days=+10).datetime,
        )

        self.client.force_login(UserFactory())
        response = self.client.get(f"/api/v1.0/course-runs/{course_run.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], course_run.id)

    def test_retrieve_course_run_by_admin_user_user(self):
        """
        Admin users can retrieve a single course run.
        """
        course_run = CourseRunFactory(
            start=arrow.utcnow().shift(days=-5).datetime,
            end=arrow.utcnow().shift(days=+90).datetime,
            enrollment_start=arrow.utcnow().shift(days=-35).datetime,
            enrollment_end=arrow.utcnow().shift(days=+10).datetime,
        )

        self.client.force_login(UserFactory())
        response = self.client.get(f"/api/v1.0/course-runs/{course_run.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], course_run.id)
