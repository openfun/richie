"""Tests for the courses app API endpoints."""
import arrow
from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseRunFactory


class CoursesApiTestCase(CMSTestCase):
    """Test requests on courses app API endpoints."""

    def test_course_run_retrieve(self):
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
