"""
Unit tests for the Course model
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import CourseState


class CourseRunModelsTestCase(TestCase):
    """
    Unit test suite for computing a date to display on the course glimpse depending on the state
    of its related course runs:
        0: a run is on-going and open for enrollment > "closing on": {enrollment_end}
        1: a run is future and open for enrollment > "starting on": {start}
        2: a run is future and not yet open or already closed for enrollment >
        "starting on": {start}
        3: a run is on-going but closed for enrollment > "on going": {None}
        4: there's a finished run in the past > "archived": {None}
        5: there are no runs at all > "coming soon": {None}
    """

    def setUp(self):
        super().setUp()
        self.now = timezone.now()

    def create_run_ongoing_open(self, course):
        """Create an on-going course run that is open for enrollment."""
        return CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
        )

    def create_run_ongoing_closed(self, course):
        """Create an on-going course run that is closed for enrollment."""
        return CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
            enrollment_end=self.now,
        )

    def create_run_archived_open(self, course):
        """Create an archived course run."""
        return CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now + timedelta(hours=1),
        )

    def create_run_archived_closed(self, course):
        """Create an archived course run."""
        return CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now - timedelta(hours=1),
        )

    def create_run_future_not_yet_open(self, course):
        """Create a course run in the future and not yet open for enrollment."""
        return CourseRunFactory(
            direct_course=course,
            start=self.now + timedelta(hours=2),
            enrollment_start=self.now + timedelta(hours=1),
        )

    def create_run_future_closed(self, course):
        """Create a course run in the future and already closed for enrollment."""
        return CourseRunFactory(
            direct_course=course,
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
        )

    def create_run_future_open(self, course):
        """Create a course run in the future and open for enrollment."""
        return CourseRunFactory(
            direct_course=course,
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
        )

    def test_models_course_state_to_be_scheduled(self):
        """
        Confirm course state result when there is no course runs at all.
        """
        course = CourseFactory()
        with self.assertNumQueries(3):
            state = course.state
        self.assertEqual(state, CourseState(7))

    def test_models_course_state_archived_closed(self):
        """
        Confirm course state when there is a course run only in the past.
        """
        course = CourseFactory()
        self.create_run_archived_closed(course)
        with self.assertNumQueries(3):
            state = course.state
        self.assertEqual(state, CourseState(6))

    def test_models_course_state_archived_open(self):
        """
        Confirm course state when there is a past course run but open for enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_archived_open(course)
        with self.assertNumQueries(3):
            state = course.state
        self.assertEqual(state, CourseState(2, course_run.enrollment_end))

    def test_models_course_state_ongoing_enrollment_closed(self):
        """
        Confirm course state when there is an on-going course run but closed for
        enrollment.
        """
        course = CourseFactory()
        self.create_run_ongoing_closed(course)
        with self.assertNumQueries(3):
            state = course.state
        self.assertEqual(state, CourseState(5))

    def test_models_course_state_future_enrollment_not_yet_open(self):
        """
        Confirm course state when there is a future course run but not yet open for
        enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_future_not_yet_open(course)
        with self.assertNumQueries(3):
            state = course.state
        expected_state = CourseState(3, course_run.start)
        self.assertEqual(state, expected_state)

        # Adding an on-going but closed course run should not change the result and require
        # only 1 additional database query
        self.create_run_ongoing_closed(course)
        with self.assertNumQueries(1):
            state = course.state
        self.assertEqual(state, expected_state)

    def test_models_course_state_future_enrollment_closed(self):
        """
        Confirm course state when there is a future course run but closed for
        enrollment.
        """
        course = CourseFactory()
        self.create_run_future_closed(course)
        with self.assertNumQueries(3):
            state = course.state
        expected_state = CourseState(4)
        self.assertEqual(state, expected_state)

        # Adding an on-going but closed course run should not change the result and require
        # only 1 additional database query
        self.create_run_ongoing_closed(course)
        with self.assertNumQueries(1):
            state = course.state
        self.assertEqual(state, expected_state)

    def test_models_course_state_future_enrollment_open(self):
        """
        Confirm course state when there is a future course run open for enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_future_open(course)
        with self.assertNumQueries(3):
            state = course.state
        expected_state = CourseState(1, course_run.start)
        self.assertEqual(state, expected_state)

        # Adding course runs of lower priority states should not change the result and require
        # only 1 additional database query
        self.create_run_ongoing_closed(course)
        self.create_run_future_closed(course)
        with self.assertNumQueries(1):
            state = course.state
        self.assertEqual(state, expected_state)

    def test_models_course_state_ongoing_open(self):
        """
        Confirm course state when there is an on-going course run open for enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(course)
        with self.assertNumQueries(3):
            state = course.state
        expected_state = CourseState(0, course_run.enrollment_end)
        self.assertEqual(state, expected_state)

        # Adding course runs of lower priority states should not change the result and require
        # only 1 additional database query
        self.create_run_ongoing_closed(course)
        self.create_run_future_closed(course)
        self.create_run_future_open(course)
        with self.assertNumQueries(1):
            state = course.state
        self.assertEqual(state, expected_state)
