"""
Reusable queryset helpers for the courses application.
"""

from datetime import MAXYEAR, datetime, timezone

from django.db.models import (
    Case,
    DateTimeField,
    IntegerField,
    OuterRef,
    Subquery,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.utils import timezone as django_timezone

MAX_DATE = datetime(MAXYEAR, 12, 31, tzinfo=timezone.utc)


def order_courses_by_state(queryset):
    """
    Annotate and order a Course queryset by the best course run state
    priority (most interesting first), then by newest first (-pk) within
    the same priority.

    Courses with no course runs are treated as TO_BE_SCHEDULED and
    appear last.
    """
    from .course import (  # pylint: disable=import-outside-toplevel,cyclic-import
        CourseState,
    )

    return queryset.annotate(
        best_state_priority=Coalesce(
            _best_course_run_state_subquery(),
            Value(CourseState.TO_BE_SCHEDULED),
        ),
    ).order_by("best_state_priority", "-pk")


def _best_course_run_state_subquery():
    """
    Return a subquery that computes the best course run state priority
    for a course (referenced via OuterRef("pk")).

    This is the SQL equivalent of Course.state["priority"], suitable for
    annotating a Course queryset to enable ordering by state.

    NULL end/enrollment_end dates are treated as infinite (matching the
    existing MAX_DATE convention in CourseRun.compute_state).
    """
    from .course import (  # pylint: disable=import-outside-toplevel,cyclic-import
        CourseRun,
        CourseRunCatalogVisibility,
        CourseState,
    )

    now = django_timezone.now()
    max_date = Value(MAX_DATE, output_field=DateTimeField())
    end = Coalesce("end", max_date)
    enrollment_end = Coalesce("enrollment_end", max_date)

    return Subquery(
        CourseRun.objects.filter(
            direct_course=OuterRef("pk"),
        )
        .exclude(catalog_visibility=CourseRunCatalogVisibility.HIDDEN)
        .annotate(
            _end=end,
            _enrollment_end=enrollment_end,
            # First match wins — the order of When clauses matters.
            # This reproduces the logic of CourseRun.compute_state().
            #
            # The clauses are organized as a decision tree:
            # 1. Missing dates → TO_BE_SCHEDULED
            # 2. start < now (course has started):
            #    a. end > now (still running):
            #       - enrollment_end > now → ONGOING_OPEN
            #       - otherwise → ONGOING_CLOSED
            #    b. end <= now (course ended):
            #       - enrollment still open → ARCHIVED_OPEN
            #       - otherwise → ARCHIVED_CLOSED
            # 3. start >= now (future course):
            #    - enrollment not yet open → FUTURE_NOT_YET_OPEN
            #    - enrollment open → FUTURE_OPEN
            #    - enrollment closed → FUTURE_CLOSED
            #
            # Because first match wins, later clauses can omit
            # conditions already ruled out above. For example,
            # ONGOING_CLOSED doesn't need enrollment_end <= now
            # because ONGOING_OPEN already caught the case where
            # enrollment_end > now. Similarly, ARCHIVED_CLOSED
            # doesn't test end <= now because the ONGOING_* clauses
            # already caught end > now.
            priority=Case(
                When(
                    start__isnull=True,
                    then=Value(CourseState.TO_BE_SCHEDULED),
                ),
                When(
                    enrollment_start__isnull=True,
                    then=Value(CourseState.TO_BE_SCHEDULED),
                ),
                # -- Course has started (start < now) --
                When(
                    start__lt=now,
                    _end__gt=now,
                    _enrollment_end__gt=now,
                    then=Value(CourseState.ONGOING_OPEN),
                ),
                When(
                    start__lt=now,
                    _end__gt=now,
                    then=Value(CourseState.ONGOING_CLOSED),
                ),
                When(
                    start__lt=now,
                    enrollment_start__lt=now,
                    _enrollment_end__gt=now,
                    then=Value(CourseState.ARCHIVED_OPEN),
                ),
                When(
                    start__lt=now,
                    then=Value(CourseState.ARCHIVED_CLOSED),
                ),
                # -- Future course (start >= now) --
                When(
                    enrollment_start__gt=now,
                    then=Value(CourseState.FUTURE_NOT_YET_OPEN),
                ),
                When(
                    _enrollment_end__gt=now,
                    then=Value(CourseState.FUTURE_OPEN),
                ),
                default=Value(CourseState.FUTURE_CLOSED),
                output_field=IntegerField(),
            ),
        )
        .order_by("priority")
        .values("priority")[:1]
    )
