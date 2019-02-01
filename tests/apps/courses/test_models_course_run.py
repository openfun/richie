"""
Unit tests for the Course model
"""
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory
from django.utils import timezone

from richie.apps.courses.factories import CourseRunFactory
from richie.apps.courses.models import CourseState


class CourseRunModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseRun model
    """

    def setUp(self):
        super().setUp()
        self.now = timezone.now()

    def test_models_course_run_state_archived(self):
        """A course run that is passed should return a state with "archived" as text."""
        course_run = CourseRunFactory(
            start=self.now - timedelta(hours=2), end=self.now - timedelta(hours=1)
        )
        self.assertEqual(course_run.state, CourseState(5, None, "archived", None))

    def test_models_course_run_state_ongoing_open(self):
        """
        A course run that is on-going and open for enrollment should return a state with a CTA
        to enroll and the date of the end of enrollment.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=3),
            start=self.now - timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
        )
        self.assertEqual(
            course_run.state,
            CourseState(0, "enroll now", "closing on", course_run.enrollment_end),
        )

    def test_models_course_run_state_ongoing_closed(self):
        """
        A course run that is on-going but closed for enrollment should return a state with
        "on-going" as text and no CTA.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=3),
            start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
        )
        self.assertEqual(course_run.state, CourseState(4, None, "on-going", None))

    def test_models_course_run_state_coming(self):
        """
        A course run that is future and not yet open for enrollment should return a state
        with a CTA to see details with the start date.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now + timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
            start=self.now + timedelta(hours=3),
            end=self.now + timedelta(hours=4),
        )
        self.assertEqual(
            course_run.state,
            CourseState(2, "see details", "starting on", course_run.start),
        )

    def test_models_course_run_state_future_open(self):
        """
        A course run that is future and open for enrollment should return a state with a CTA
        to enroll and the start date.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
            start=self.now + timedelta(hours=2),
            end=self.now + timedelta(hours=3),
        )
        self.assertEqual(
            course_run.state,
            CourseState(1, "enroll now", "starting on", course_run.start),
        )

    def test_models_course_run_state_future_closed(self):
        """
        A course run that is future and already closed for enrollment should return a state
        with "enrollment closed" as text and no CTA.
        """
        course_run = CourseRunFactory(
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            start=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
        )
        self.assertEqual(
            course_run.state, CourseState(3, None, "enrollment closed", None)
        )

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
        When used in the `render_model` template tag, it should not break when passed a
        request argument.
        """
        course_run = CourseRunFactory(languages=["fr"])
        request = RequestFactory().get("/")
        self.assertEqual(course_run.get_languages_display(request), "French")
