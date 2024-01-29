"""Test suite for the LMS select function."""

from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.courses.lms import LMSHandler
from richie.apps.courses.lms.base import BaseLMSBackend
from richie.apps.courses.lms.edx import EdXLMSBackend
from richie.apps.courses.lms.joanie import JoanieBackend


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
        ],
    )
    def test_lms_select(self):
        """
        The "select_lms" util function should return a backend instance with its configuration
        or None if the url does not match any backend or is blank or any course id
        can be extract from the resource_link.
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

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "https://www.example.com",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_REGEX": r"^.*/moocs/(?P<course_id>.*)",
            },
            {
                "BASE_URL": "https://www.joanie.org",
                "BACKEND": "richie.apps.courses.lms.joanie.JoanieBackend",
                "COURSE_REGEX": "^.*/api/(?P<resource_type>(course-runs|products))/(?P<resource_id>.*)/?$",  # noqa pylint: disable=line-too-long
            },
        ],
    )
    def test_lms_select_with_joanie(self):
        """
        The "select_lms" util function should return JoanieBackend when a resource_link
        match JOANIE.COURSE_REGEX
        """
        backend = LMSHandler.select_lms("https://www.example.com/moocs/123")
        self.assertEqual(type(backend), EdXLMSBackend)
        self.assertEqual(backend.configuration["BASE_URL"], "https://www.example.com")

        backend = LMSHandler.select_lms("https://www.joanie.org/api/products/123")
        self.assertEqual(type(backend), JoanieBackend)
        self.assertEqual(backend.configuration["BASE_URL"], "https://www.joanie.org")

        self.assertIsNone(LMSHandler.select_lms("https://unknown.io/course/123"))

        self.assertIsNone(LMSHandler.select_lms(None))
