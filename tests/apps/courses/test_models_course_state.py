"""
Unit tests for the Course model
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import Course, CourseState
from richie.apps.courses.models.course import CourseRunCatalogVisibility
from richie.apps.courses.models.querysets import order_courses_by_state


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
        with self.assertNumQueries(4):
            state = course.state
        self.assertEqual(state, CourseState(6))

    def test_models_course_state_archived_open(self):
        """
        Confirm course state when there is a past course run but open for enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_archived_open(course)
        with self.assertNumQueries(4):
            state = course.state
        self.assertEqual(state, CourseState(2, course_run.enrollment_end))

    def test_models_course_state_ongoing_enrollment_closed(self):
        """
        Confirm course state when there is an on-going course run but closed for
        enrollment.
        """
        course = CourseFactory()
        self.create_run_ongoing_closed(course)
        with self.assertNumQueries(4):
            state = course.state
        self.assertEqual(state, CourseState(5))

    def test_models_course_state_future_enrollment_not_yet_open(self):
        """
        Confirm course state when there is a future course run but not yet open for
        enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_future_not_yet_open(course)
        with self.assertNumQueries(4):
            state = course.state
        expected_state = CourseState(3, course_run.start)
        self.assertEqual(state, expected_state)

        # Adding an on-going but closed course run should not change the result and require
        # only 1 additional database query
        self.create_run_ongoing_closed(course)
        with self.assertNumQueries(2):
            state = course.state
        self.assertEqual(state, expected_state)

    def test_models_course_state_future_enrollment_closed(self):
        """
        Confirm course state when there is a future course run but closed for
        enrollment.
        """
        course = CourseFactory()
        self.create_run_future_closed(course)
        with self.assertNumQueries(4):
            state = course.state
        expected_state = CourseState(4)
        self.assertEqual(state, expected_state)

        # Adding an on-going but closed course run should not change the result and require
        # only 1 additional database query
        with self.assertNumQueries(2):
            state = course.state
        self.assertEqual(state, expected_state)

    def test_models_course_state_future_enrollment_open(self):
        """
        Confirm course state when there is a future course run open for enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_future_open(course)
        with self.assertNumQueries(4):
            state = course.state
        expected_state = CourseState(1, course_run.start)
        self.assertEqual(state, expected_state)

        # Adding course runs of lower priority states should not change the result and require
        # only 1 additional database query
        self.create_run_ongoing_closed(course)
        self.create_run_future_closed(course)
        with self.assertNumQueries(2):
            state = course.state
        self.assertEqual(state, expected_state)

    def test_models_course_state_ongoing_open(self):
        """
        Confirm course state when there is an on-going course run open for enrollment.
        """
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(course)
        with self.assertNumQueries(4):
            state = course.state
        expected_state = CourseState(0, course_run.enrollment_end)
        self.assertEqual(state, expected_state)

        # Adding course runs of lower priority states should not change the result and require
        # only 1 additional database query
        self.create_run_ongoing_closed(course)
        self.create_run_future_closed(course)
        self.create_run_future_open(course)
        with self.assertNumQueries(2):
            state = course.state
        self.assertEqual(state, expected_state)

    def test_models_course_state_does_not_compute_hidden_runs(self):
        """
        Confirm that course state should never be computed across course runs
        having `catalog_visibility` as `hidden`.
        """
        course = CourseFactory(should_publish=True)
        on_going_course_run = self.create_run_ongoing_open(course)
        future_open_course_run = self.create_run_future_open(course)

        self.assertEqual(course.state["priority"], 0)

        on_going_course_run.catalog_visibility = CourseRunCatalogVisibility.HIDDEN
        on_going_course_run.save()

        course.refresh_from_db()
        on_going_course_run.refresh_from_db()

        self.assertEqual(course.state["priority"], 1)

        future_open_course_run.catalog_visibility = CourseRunCatalogVisibility.HIDDEN
        future_open_course_run.save()

        course.refresh_from_db()
        future_open_course_run.refresh_from_db()

        self.assertEqual(course.state["priority"], 7)


class OrderCoursesByStateTestCase(TestCase):
    """
    Unit test suite to validate that order_courses_by_state() produces
    the same priority as the Python-computed Course.state["priority"].
    """

    def setUp(self):
        super().setUp()
        self.now = timezone.now()

    def _get_sql_priority(self, course):
        """Annotate the course with order_courses_by_state and return the priority."""
        return (
            order_courses_by_state(Course.objects.filter(pk=course.pk))
            .values_list("best_state_priority", flat=True)
            .first()
        )

    def test_best_state_subquery_ongoing_open(self):
        """SQL subquery should return ONGOING_OPEN for a course with an ongoing open run."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.ONGOING_OPEN)

    def test_best_state_subquery_future_open(self):
        """SQL subquery should return FUTURE_OPEN for a course with a future open run."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.FUTURE_OPEN)

    def test_best_state_subquery_archived_open(self):
        """SQL subquery should return ARCHIVED_OPEN for a course with an archived open run."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now + timedelta(hours=1),
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.ARCHIVED_OPEN)

    def test_best_state_subquery_future_not_yet_open(self):
        """SQL subquery should return FUTURE_NOT_YET_OPEN."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now + timedelta(hours=2),
            enrollment_start=self.now + timedelta(hours=1),
        )
        self.assertEqual(
            self._get_sql_priority(course), CourseState.FUTURE_NOT_YET_OPEN
        )

    def test_best_state_subquery_future_closed(self):
        """SQL subquery should return FUTURE_CLOSED."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.FUTURE_CLOSED)

    def test_best_state_subquery_ongoing_closed(self):
        """SQL subquery should return ONGOING_CLOSED."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
            enrollment_end=self.now,
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.ONGOING_CLOSED)

    def test_best_state_subquery_archived_closed(self):
        """SQL subquery should return ARCHIVED_CLOSED."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now - timedelta(hours=1),
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.ARCHIVED_CLOSED)

    def test_best_state_subquery_to_be_scheduled(self):
        """SQL subquery should return TO_BE_SCHEDULED when there are no runs."""
        course = CourseFactory()
        self.assertEqual(self._get_sql_priority(course), CourseState.TO_BE_SCHEDULED)

    def test_best_state_subquery_null_dates(self):
        """Null end/enrollment_end should be treated as infinite (forever open)."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=None,
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=None,
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.ONGOING_OPEN)

    def test_best_state_subquery_picks_best_run(self):
        """When a course has multiple runs, the subquery should return the best priority."""
        course = CourseFactory()
        # Archived run
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=2),
            end=self.now - timedelta(hours=1),
            enrollment_end=self.now - timedelta(hours=1),
        )
        # Ongoing open run (best)
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.ONGOING_OPEN)

    def test_best_state_subquery_excludes_hidden(self):
        """Hidden course runs should be excluded from the subquery."""
        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
        )
        self.assertEqual(self._get_sql_priority(course), CourseState.TO_BE_SCHEDULED)
