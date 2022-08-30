"""
Test suite for the cache module in the `core` application
"""

import math
import time
from datetime import datetime, timedelta

from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone
from django.utils.http import http_date

from richie.apps.courses.cache import CACHE_MARGIN
from richie.apps.courses.factories import CourseFactory, CourseRunFactory

# pylint: disable=too-many-public-methods


class TestLimitBrowserCacheTTLHeadersOnCoursePage(TestCase):
    """
    Test case for the LimitBrowserCacheTTLHeaders middleware.
    """

    def _verify_cache_headers(
        self, response, date_time_to_check: datetime, now: datetime
    ):
        """
        Utility that check the `Expires` and the `Cache-Control` HTTP headers.
        Is near the `date_time_to_check`.
        It is not possible to assert at the second, because we can't know how much time it
        will take to run the tests.
        """
        self.assertIn(
            response["Expires"],
            (
                http_date((date_time_to_check - timedelta(seconds=2)).timestamp()),
                http_date((date_time_to_check - timedelta(seconds=1)).timestamp()),
                http_date((date_time_to_check).timestamp()),
                http_date((date_time_to_check + timedelta(seconds=1)).timestamp()),
                http_date((date_time_to_check + timedelta(seconds=2)).timestamp()),
                http_date((date_time_to_check + timedelta(seconds=3)).timestamp()),
                http_date((date_time_to_check + timedelta(seconds=4)).timestamp()),
                http_date((date_time_to_check + timedelta(seconds=5)).timestamp()),
            ),
        )

        def func(header_date_time: datetime):
            return "max-age=" + str(math.trunc(header_date_time.total_seconds()))

        self.assertIn(
            response["Cache-Control"],
            (
                func(date_time_to_check - now - timedelta(seconds=5)),
                func(date_time_to_check - now - timedelta(seconds=4)),
                func(date_time_to_check - now - timedelta(seconds=3)),
                func(date_time_to_check - now - timedelta(seconds=2)),
                func(date_time_to_check - now - timedelta(seconds=1)),
                func(date_time_to_check - now),
                func(date_time_to_check - now + timedelta(seconds=1)),
            ),
        )

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run_open(self):
        """
        Test if a course page with a date that change its user interface on the next minute is
        cached only for 30 seconds.
        """
        now = timezone.now()

        course = CourseFactory()
        next_minute = now + timedelta(minutes=1)
        CourseRunFactory(
            direct_course=course,
            enrollment_start=now - timedelta(hours=3),
            start=now - timedelta(hours=2),
            enrollment_end=next_minute,
            end=now + timedelta(hours=2),
        )

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self._verify_cache_headers(response, next_minute - CACHE_MARGIN, now)

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run_multiple(self):
        """
        Test if a course page with multiple course runs with different dates don't cache too much.
        """
        now = timezone.now()

        course = CourseFactory()
        next_date = now + timedelta(minutes=4)
        CourseRunFactory(
            direct_course=course,
            enrollment_start=now - timedelta(hours=3),
            start=now - timedelta(hours=2),
            enrollment_end=now - timedelta(hours=1),
            end=now + timedelta(hours=2),
        )
        CourseRunFactory(
            direct_course=course,
            enrollment_start=now - timedelta(hours=3),
            start=now - timedelta(hours=2),
            enrollment_end=next_date,
            end=None,
        )

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self._verify_cache_headers(response, next_date - CACHE_MARGIN, now)

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run(self):
        """
        Test if a course page without any course run returns no default Cache-Control and Expires
        http header values.
        """
        course = CourseFactory()

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertEqual(http_date(time.time() + 3600), response["Expires"])
        self.assertIn("max-age=3600", response["Cache-Control"])

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run_archived(self):
        """
        Ensure that the middleware returns the default cache headers for a course with an archived
        run.
        """
        now = timezone.now()

        course = CourseFactory()
        CourseRunFactory(
            direct_course=course,
            enrollment_start=now - timedelta(hours=5),
            start=now - timedelta(hours=4),
            enrollment_end=now - timedelta(hours=3),
            end=now - timedelta(minutes=1),
        )

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertEqual(http_date(time.time() + 3600), response["Expires"])
        self.assertIn("max-age=3600", response["Cache-Control"])

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run_almost_open_to_enroll(self):
        """
        Ensure that the middleware returns a cache headers only for small number of seconds for a
        course page with a run that is almost to open to enroll.
        """
        now = timezone.now()

        course = CourseFactory()
        ref_date = now + timedelta(minutes=1)
        CourseRunFactory(
            direct_course=course,
            enrollment_start=ref_date,
            start=now + timedelta(hours=5),
            enrollment_end=now + timedelta(hours=6),
            end=now + timedelta(hours=7),
        )

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self._verify_cache_headers(response, ref_date - CACHE_MARGIN, now)

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run_going_open_to_enroll(self):
        """
        Ensure that the middleware doesn't cache for a course with a run that is going to open to
        enroll in a couple of seconds.
        """
        now = timezone.now()

        course = CourseFactory()
        ref_date = now + timedelta(seconds=10)
        CourseRunFactory(
            direct_course=course,
            enrollment_start=ref_date,
            start=now + timedelta(hours=5),
            enrollment_end=now + timedelta(hours=6),
            end=now + timedelta(hours=7),
        )

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertFalse(response.has_header("Expires"))
        self.assertFalse(response.has_header("Cache-Control"))

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run_going_close_to_enroll(self):
        """
        Ensure that the middleware doesn't cache for a course with a run that is going to close to
        enroll in a couple of seconds.
        """
        now = timezone.now()

        course = CourseFactory()
        ref_date = now + timedelta(seconds=10)
        CourseRunFactory(
            direct_course=course,
            enrollment_start=now - timedelta(hours=5),
            enrollment_end=ref_date,
            start=now + timedelta(hours=5),
            end=now + timedelta(hours=7),
        )

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertFalse(response.has_header("Expires"))
        self.assertFalse(response.has_header("Cache-Control"))

    @override_settings(
        MAX_BROWSER_CACHE_TTL=8600,
        CMS_CACHE_DURATIONS={"menus": 3600, "content": 3600, "permissions": 3600},
    )
    def test_middleware_limit_cache_for_course_page_run_has_closed_to_enroll(self):
        """
        Ensure that the middleware doesn't cache for a course with a run that has closed to
        enroll at a couple of seconds ago.
        """
        now = timezone.now()

        course = CourseFactory()
        ref_date = now - timedelta(seconds=10)
        CourseRunFactory(
            direct_course=course,
            enrollment_start=now - timedelta(hours=5),
            enrollment_end=ref_date,
            start=now + timedelta(hours=5),
            end=now + timedelta(hours=7),
        )

        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertFalse(response.has_header("Expires"))
        self.assertFalse(response.has_header("Cache-Control"))
