"""Test suite for the LMS select function."""
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.courses.lms import LMSHandler
from richie.apps.courses.lms.base import BaseLMSBackend
from richie.apps.courses.lms.edx import TokenEdXLMSBackend


class LMSSelectTestCase(TestCase):
    """Test suite for the LMS select function."""

    @override_settings(
        LMS_BACKENDS=[
            {
                "SELECTOR_REGEX": r".*example.com.*",
                "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
                "BASE_URL": "https://www.example.com",
            },
            {
                "SELECTOR_REGEX": r".*edx.org.*",
                "BACKEND": "richie.apps.courses.lms.edx.BaseLMSBackend",
                "BASE_URL": "https://edx.org",
            },
        ]
    )
    def test_lms_select(self):
        """
        The "select_lms" util function should return a backend instance with its configuration
        or raise an ImproperlyConfigurer error if the url does not match any backend or is blank.
        """
        backend = LMSHandler.select_lms("https://www.example.com/course/123")
        self.assertEqual(type(backend), TokenEdXLMSBackend)
        self.assertEqual(backend.configuration["BASE_URL"], "https://www.example.com")

        backend = LMSHandler.select_lms("https://edx.org/course/123")
        self.assertEqual(type(backend), BaseLMSBackend)
        self.assertEqual(backend.configuration["BASE_URL"], "https://edx.org")

        self.assertIsNone(LMSHandler.select_lms("https://unknown.io/course/123"))

        self.assertIsNone(LMSHandler.select_lms(None))
