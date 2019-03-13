"""
Unit tests for the Course model
"""
from datetime import timedelta

from django.conf import settings
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

    def test_models_course_run_state_to_be_scheduled(self):
        """
        A course run that has no start date should return a state with priority 6 and
        "to be scheduled" as text.
        """
        course_run = CourseRunFactory(start=None)
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 6,
                "text": "to be scheduled",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_archived(self):
        """
        A course run that is passed should return a state with priority 5 and "archived"
        as text.
        """
        course_run = CourseRunFactory(
            start=self.now - timedelta(hours=2), end=self.now - timedelta(hours=1)
        )
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 5,
                "text": "archived",
                "call_to_action": None,
                "datetime": None,
            },
        )

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
            dict(course_run.state),
            {
                "priority": 0,
                "text": "closing on",
                "call_to_action": "enroll now",
                "datetime": self.now + timedelta(hours=1),
            },
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
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 4,
                "text": "on-going",
                "call_to_action": None,
                "datetime": None,
            },
        )

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
            dict(course_run.state),
            {
                "priority": 2,
                "text": "starting on",
                "call_to_action": "see details",
                "datetime": self.now + timedelta(hours=3),
            },
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
            dict(course_run.state),
            {
                "priority": 1,
                "text": "starting on",
                "call_to_action": "enroll now",
                "datetime": self.now + timedelta(hours=2),
            },
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
            dict(course_run.state),
            {
                "priority": 3,
                "text": "enrollment closed",
                "call_to_action": None,
                "datetime": None,
            },
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

    def test_models_course_run_field_languages_max_choices(self):
        """
        The languages field should not accept more than 50 choices.
        """
        languages = [l[0] for l in settings.ALL_LANGUAGES[:51]]

        # 50 languages should be fine
        CourseRunFactory(languages=languages[:-1])

        # 51 languages should fail
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=languages)
        self.assertEqual(
            context.exception.messages[0], "You can only select up to 50 choices."
        )

    def test_models_course_run_field_languages_one_invalid(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=["fr", "zzzzz"])
        self.assertEqual(
            context.exception.messages[0], "Value zzzzz is not a valid choice."
        )

    def test_models_course_run_field_languages_two_invalid(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=["fr", "zzzzz", "de", "yyyyy"])
        self.assertEqual(
            context.exception.messages[0],
            "Values zzzzz and yyyyy are not valid choices.",
        )

    def test_models_course_run_field_languages_three_invalid(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument.
        """
        with self.assertRaises(ValidationError) as context:
            CourseRunFactory(languages=["fr", "zzzzz", "yyyyy", "xxxxx"])
        self.assertEqual(
            context.exception.messages[0],
            "Values zzzzz, yyyyy and xxxxx are not valid choices.",
        )

    def test_models_course_run_get_languages_display_one_language(self):
        """
        With one language, it should return its readable version without any comma.
        """
        course_run = CourseRunFactory(languages=["fr"])
        self.assertEqual(course_run.get_languages_display(), "French")

    def test_models_course_run_get_languages_display_two_languages(self):
        """
        With 2 languages, it should return them joined with "them".
        """
        course_run = CourseRunFactory(languages=["fr", "en"])
        self.assertEqual(course_run.get_languages_display(), "French and english")

    def test_models_course_run_get_languages_display_three_languages(self):
        """
        With several languages, it should return a comma separated list of their readable
        version with "and" for the last one.
        """
        course_run = CourseRunFactory(languages=["fr", "en", "de"])
        self.assertEqual(
            course_run.get_languages_display(), "French, english and german"
        )

    def test_models_course_run_get_languages_display_request(self):
        """
        When used in the `render_model` template tag, it should not break when passed a
        request argument (the DjangoCMS frontend editing does it).
        """
        course_run = CourseRunFactory(languages=["fr"])
        request = RequestFactory().get("/")
        self.assertEqual(course_run.get_languages_display(request), "French")
