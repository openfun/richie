"""
Unit tests for the Course model
"""
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import CourseRun


class CourseRunModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseRun model
    """

    def setUp(self):
        super().setUp()
        self.now = timezone.now()

    def test_models_course_run_fields_course_required(self):
        """
        The `course` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(course=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_models_course_run_fields_course_cascade(self):
        """
        A course run should be deleted if its related course is deleted.
        """
        course_run = CourseRunFactory()
        course_run.course.delete()
        self.assertFalse(CourseRun.objects.filter(id=course_run.id).exists())

    def test_models_course_run_fields_course_runs(self):
        """
        The "course_runs" field should always return the course runs linked to the draft version
        of the course.
        """
        # Create a draft course with course runs
        course = CourseFactory()
        course_runs = set(CourseRunFactory.create_batch(2, course=course))

        # The course runs should be accessible from the course
        self.assertEqual(set(course.course_runs.all()), course_runs)

        # The published course should point to the same course runs
        course.extended_object.publish("en")
        course.refresh_from_db()
        self.assertEqual(set(course.public_extension.course_runs.all()), course_runs)

    def test_models_course_run_state_archived(self):
        """A course run that is passed should return a state "is_archived"."""
        course_run = CourseRunFactory(
            start=self.now - timedelta(hours=2), end=self.now - timedelta(hours=1)
        )
        self.assertEqual(course_run.state, "is_archived")

    def test_models_course_run_state_ongoing_open(self):
        """
        A course run that is on-going and open for enrollment should return a state `is_open`.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=3),
            start=self.now - timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
        )
        self.assertEqual(course_run.state, "is_open")

    def test_models_course_run_state_ongoing_closed(self):
        """
        A course run that is on-going but closed for enrollment should return a state `is_ongoing`.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=3),
            start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
        )
        self.assertEqual(course_run.state, "is_ongoing")

    def test_models_course_run_state_coming(self):
        """
        A course run that is future and not yet open for enrollment should return a state
        `is_coming`.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now + timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
            start=self.now + timedelta(hours=3),
            end=self.now + timedelta(hours=4),
        )
        self.assertEqual(course_run.state, "is_coming")

    def test_models_course_run_state_future_open(self):
        """
        A course run that is future and not yet open for enrollment should return a state
        `is_coming`.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
            start=self.now + timedelta(hours=2),
            end=self.now + timedelta(hours=3),
        )
        self.assertEqual(course_run.state, "is_open")

    def test_models_course_run_state_future_closed(self):
        """
        A course run that is future and already closed for enrollment should return a state
        `is_closed`.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            start=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
        )
        self.assertEqual(course_run.state, "is_closed")
