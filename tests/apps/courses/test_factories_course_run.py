"""
Unit tests for the CourseRun factory
"""

from datetime import timedelta
from unittest import mock

from django.test import TestCase
from django.utils import timezone

from richie.apps.courses.factories import CourseRunFactory


class CourseRunFactoriesTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseRun factory
    """

    def test_factories_course_run_random_dates(self):
        """
        The random dates computed for the course run should make sense.
        """
        now = timezone.now()
        with mock.patch.object(timezone, "now", return_value=now):
            course_run = CourseRunFactory()

        self.assertTrue(
            now - timedelta(days=500) < course_run.start < now + timedelta(days=500)
        )
        self.assertTrue(
            course_run.enrollment_start <= course_run.start <= course_run.end
        )
        self.assertTrue(
            course_run.enrollment_start <= course_run.enrollment_end <= course_run.end
        )

    def test_factories_course_run_null_dates(self):
        """
        Setting a date to None should not make the factory fail.
        """
        for field in ["start", "end", "enrollment_start", "enrollment_end"]:
            course_run = CourseRunFactory(**{field: None})
            self.assertIsNone(getattr(course_run, field))
