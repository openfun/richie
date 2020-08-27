"""
Base backend to connect richie with an LMS
"""
import re
import time

from django.core.cache import cache
from django.utils import timezone

from richie.apps.courses.factories import CourseRunFactory


class BaseLMSBackend:
    """
    Base backend to hold the methods common to all backends and provide a skeleton for others.
    """

    def __init__(self, configuration, *args, **kwargs):
        """Attache configuration to the backend instance."""
        super().__init__(*args, **kwargs)
        self.configuration = configuration

    def extract_course_id(self, url):
        """Extract the LMS course id from the course run url."""
        return re.match(self.configuration["COURSE_REGEX"], url).group("course_id")


class DemoLMSBackend(BaseLMSBackend):
    """LMS backend for Richie to mock the behavior of an LMS."""

    @staticmethod
    def get_cache_key(username, course_id):
        """Compute compound cache key from username and course id."""
        return f"demo_lms_backend_enrollment_{username:s}_{course_id:s}"

    def get_enrollment(self, user, url):
        """Get fake enrollment status from cache for a user on a course run given its url."""
        course_id = self.extract_course_id(url)
        course_run = CourseRunFactory.build()

        if cache.get(self.get_cache_key(user.username, course_id)):
            return {
                "created": timezone.now().isoformat(),  # 2020-07-21T17:42:04.675422Z
                "mode": "audit",
                "is_active": True,
                "course_details": {
                    "course_id": course_id,
                    "course_name": f"Course: {course_id:s}",
                    "enrollment_start": course_run.enrollment_start.isoformat(),
                    "enrollment_end": course_run.enrollment_end.isoformat(),
                    "course_start": course_run.start.isoformat(),
                    "course_end": course_run.end.isoformat(),
                    "invite_only": False,
                    "course_modes": [
                        {
                            "slug": "audit",
                            "name": "Audit",
                            "min_price": 0,
                            "suggested_prices": "",
                            "currency": "eur",
                            "expiration_datetime": None,
                            "description": None,
                            "sku": None,
                            "bulk_sku": None,
                        }
                    ],
                },
                "user": user.username,
            }

        return None

    def set_enrollment(self, user, url):
        """Set fake enrollment to cache for a user with a course run given its url."""

        time.sleep(0.3)
        course_id = self.extract_course_id(url)

        cache.set(self.get_cache_key(user.username, course_id), True)
        return True
