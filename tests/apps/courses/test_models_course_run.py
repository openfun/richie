"""
Unit tests for the Course model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import CourseRun


class CourseRunModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseRun model
    """

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
