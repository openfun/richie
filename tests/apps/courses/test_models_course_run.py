"""
Unit tests for the Course model
"""
import random
from datetime import datetime, timedelta
from unittest import mock

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.test.client import RequestFactory
from django.utils import timezone

import pytz

from richie.apps.core.defaults import ALL_LANGUAGES
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.factories import CourseFactory, CourseRunFactory


# pylint: disable=too-many-public-methods
class CourseRunModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the CourseRun model
    """

    def setUp(self):
        super().setUp()
        self.now = timezone.now()

    def test_models_course_run_get_course_direct_child_with_parent(self):
        """
        We should be able to retrieve the course from a course run that is its direct child
        when the course is below a root page (this is creating a difficulty because the
        query we build in `get_course` can create duplicates if we don't add the right clauses).
        """
        page = create_i18n_page("A page", published=True)
        course = CourseFactory(page_parent=page, should_publish=True)
        course_run = CourseRunFactory(
            page_parent=course.extended_object, should_publish=True
        )
        # Add a sibling course to make sure it is not returned
        CourseFactory(should_publish=True)
        # Add a snapshot to make sure it does not interfere
        CourseFactory(page_parent=course.extended_object, should_publish=True)

        self.assertEqual(course_run.get_course(), course)
        self.assertEqual(
            course_run.public_extension.get_course(), course.public_extension
        )

    def test_models_course_run_get_course_direct_child(self):
        """
        We should be able to retrieve the course from a course run that is its direct child.
        """
        course = CourseFactory(should_publish=True)
        course_run = CourseRunFactory(
            page_parent=course.extended_object, should_publish=True
        )
        # Add a sibling course to make sure it is not returned
        CourseFactory(should_publish=True)
        # Add a snapshot to make sure it does not interfere
        CourseFactory(page_parent=course.extended_object, should_publish=True)

        self.assertEqual(course_run.get_course(), course)
        self.assertEqual(
            course_run.public_extension.get_course(), course.public_extension
        )

    def test_models_course_run_get_course_child_of_snapshot(self):
        """
        We should be able to retrieve the course from a course run that is a child of one of
        its snapshots.
        """
        course = CourseFactory(should_publish=True)
        snapshot = CourseFactory(
            page_parent=course.extended_object, should_publish=True
        )
        course_run = CourseRunFactory(
            page_parent=snapshot.extended_object, should_publish=True
        )
        # Add a sibling course to make sure it is not returned
        CourseFactory(should_publish=True)

        self.assertEqual(course_run.get_course(), course)
        self.assertEqual(
            course_run.public_extension.get_course(), course.public_extension
        )

    def test_models_course_run_state_start_to_be_scheduled(self):
        """
        A course run that has no start date should return a state with priority 6
        and "to be scheduled" as text.
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

    def test_models_course_run_state_enrollment_start_to_be_scheduled(self):
        """
        A course run that has no enrollment start date should return a state with priority 6
        and "to be scheduled" as text.
        """
        course_run = CourseRunFactory(enrollment_start=None)
        self.assertEqual(
            dict(course_run.state),
            {
                "priority": 6,
                "text": "to be scheduled",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_no_end_date(self):
        """
        A course run with no end date is deemed to be forever on-going.
        """
        course_run = CourseRunFactory(end=None)

        # The course run should be open during its enrollment period
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_start.timestamp()) + 1,
                int(course_run.enrollment_end.timestamp()) - 1,
            )
        ).replace(tzinfo=pytz.utc)

        with mock.patch.object(timezone, "now", return_value=now):
            state = course_run.state

        self.assertIn(dict(state)["priority"], [0, 1])

        # The course run should be on-going at any date after its end of enrollment
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_end.timestamp()),
                int(datetime(9999, 12, 31).timestamp()),
            )
        ).replace(tzinfo=pytz.utc)

        with mock.patch.object(timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 4,
                "text": "on-going",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_no_enrollment_end(self):
        """
        A course run that has no end of enrollemnt is deemed to be open until its end.
        """
        course_run = CourseRunFactory(enrollment_end=None)

        # The course run should be open between its start of enrollment and its start
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_start.timestamp()) + 1,
                int(course_run.start.timestamp()) - 1,
            )
        ).replace(tzinfo=pytz.utc)

        with mock.patch.object(timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 1,
                "text": "starting on",
                "call_to_action": "enroll now",
                "datetime": course_run.start,
            },
        )

        # The course run should be on-going & open between its start and its end
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.start.timestamp()) + 1,
                int(course_run.end.timestamp()) - 1,
            )
        ).replace(tzinfo=pytz.utc)

        with mock.patch.object(timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 0,
                "text": "closing on",
                "call_to_action": "enroll now",
                "datetime": course_run.end,
            },
        )

        # The course run should be archived after its end
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.end.timestamp()) + 1,
                int(datetime(9999, 12, 31).timestamp()) - 1,
            )
        ).replace(tzinfo=pytz.utc)

        with mock.patch.object(timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 5,
                "text": "archived",
                "call_to_action": None,
                "datetime": None,
            },
        )

    def test_models_course_run_state_forever_open(self):
        """
        A course run that has no end of enrollement and no end should be forever open.
        """
        course_run = CourseRunFactory(enrollment_end=None, end=None)

        # The course run should be open between its start of enrollment and its start
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.enrollment_start.timestamp()) + 1,
                int(course_run.start.timestamp()) - 1,
            )
        ).replace(tzinfo=pytz.utc)

        with mock.patch.object(timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 1,
                "text": "starting on",
                "call_to_action": "enroll now",
                "datetime": course_run.start,
            },
        )

        # The course run should be on-going & open forever after its start
        now = datetime.utcfromtimestamp(
            random.randrange(
                int(course_run.start.timestamp()) + 1,
                int(datetime(9999, 12, 31).timestamp()) - 1,
            )
        ).replace(tzinfo=pytz.utc)

        with mock.patch.object(timezone, "now", return_value=now):
            state = course_run.state

        self.assertEqual(
            dict(state),
            {
                "priority": 0,
                "text": "forever open",
                "call_to_action": "enroll now",
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
        languages = [l[0] for l in ALL_LANGUAGES[:51]]

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
