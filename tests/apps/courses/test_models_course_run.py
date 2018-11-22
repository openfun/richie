"""
Unit tests for the Course model
"""
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory
from django.utils import timezone

from richie.apps.courses.factories import CourseRunFactory


class CourseRunModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseRun model
    """

    def setUp(self):
        super().setUp()
        self.now = timezone.now()

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

    def test_models_course_run_field_languages_null(self):
        """
        The languages field should not be null.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_models_course_run_field_languages_blank(self):
        """
        The languages field should not be blank.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=[])
        self.assertEqual(context.exception.messages[0], "This field cannot be blank.")

    def test_models_course_run_get_languages_display_several_languages(self):
        """
        With several languages, it should return a comma separated list of their readable version.
        """
        course_run = CourseRunFactory(languages=["en", "fr"])
        self.assertEqual(course_run.get_languages_display(), "English, French")

    def test_models_course_run_get_languages_display_one_language(self):
        """
        With one language, it should return its readable version without any comma.
        """
        course_run = CourseRunFactory(languages=["fr"])
        self.assertEqual(course_run.get_languages_display(), "French")

    def test_models_course_run_get_languages_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a request argument.
        """
        course_run = CourseRunFactory(languages=["fr"])
        request = RequestFactory().get("/")
        self.assertEqual(course_run.get_languages_display(request), "French")
