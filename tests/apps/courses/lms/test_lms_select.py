"""Test suite for the LMS select function."""
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.courses.lms import LMSHandler
from richie.apps.courses.lms.base import BaseLMSBackend
from richie.apps.courses.lms.edx import EdXLMSBackend


class LMSSelectTestCase(TestCase):
    """Test suite for the LMS select function."""

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "COURSE_REGEX": r"^.*/moocs/(?P<course_id>.*)",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "BASE_URL": "https://www.example.com",
            },
            {
                "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)",
                "BACKEND": "richie.apps.courses.lms.base.BaseLMSBackend",
                "BASE_URL": "https://edx.org",
            },
        ]
    )
    def test_lms_select(self):
        """
        The "select_lms" util function should return a backend instance with its configuration
        or raise an ImproperlyConfigurer error if the url does not match any backend or is blank or
        any course id can be extract from the resource_link.
        """
        backend = LMSHandler.select_lms("https://www.example.com/moocs/123")
        self.assertEqual(type(backend), EdXLMSBackend)
        self.assertEqual(backend.configuration["BASE_URL"], "https://www.example.com")

        backend = LMSHandler.select_lms("https://edx.org/courses/123")
        self.assertEqual(type(backend), BaseLMSBackend)
        self.assertEqual(backend.configuration["BASE_URL"], "https://edx.org")

        self.assertIsNone(LMSHandler.select_lms("https://edx.org/wrong-path/123"))

        self.assertIsNone(LMSHandler.select_lms("https://unknown.io/course/123"))

        self.assertIsNone(LMSHandler.select_lms(None))
