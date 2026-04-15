# -*- coding: utf-8 -*-
"""
Tests for the LMS context processor
"""
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.core.context_processors import FrontendContextProcessor


class ContextProcessorLmsTestCase(TestCase):
    """Test suite for FrontendContextProcessor.get_lms_context"""

    def setUp(self):
        self.processor = FrontendContextProcessor()

    @override_settings(RICHIE_LMS_BACKENDS=[])
    def test_get_lms_context_returns_none_when_no_backends(self):
        """get_lms_context should return None when RICHIE_LMS_BACKENDS is empty."""
        result = self.processor.get_lms_context()
        self.assertIsNone(result)

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "https://lms.example.com",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_REGEX": r"^https://lms\.example\.com/courses/(?P<course_id>.*)/course/?$",
                "JS_BACKEND": "openedx-hawthorn",
                "JS_COURSE_REGEX": r"^https://lms\.example\.com/courses/(.*)/course/?$",
            }
        ]
    )
    def test_get_lms_context_without_js_next_url(self):
        """
        get_lms_context should not include 'next_url' key when JS_NEXT_URL is not configured.
        """
        result = self.processor.get_lms_context()

        self.assertEqual(len(result), 1)
        entry = result[0]
        self.assertEqual(entry["endpoint"], "https://lms.example.com")
        self.assertEqual(entry["backend"], "openedx-hawthorn")
        self.assertNotIn("next_url", entry)

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "https://lms.example.com",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_REGEX": r"^https://lms\.example\.com/courses/(?P<course_id>.*)/course/?$",
                "JS_BACKEND": "openedx-hawthorn",
                "JS_COURSE_REGEX": r"^https://lms\.example\.com/courses/(.*)/course/?$",
                "JS_NEXT_URL": "richie-nau",
            }
        ]
    )
    def test_get_lms_context_with_js_next_url(self):
        """
        get_lms_context should include 'next_url' when JS_NEXT_URL is configured.
        """
        result = self.processor.get_lms_context()

        self.assertEqual(len(result), 1)
        entry = result[0]
        self.assertEqual(entry["endpoint"], "https://lms.example.com")
        self.assertEqual(entry["backend"], "openedx-hawthorn")
        self.assertEqual(entry["next_url"], "richie-nau")

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "https://lms1.example.com",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_REGEX": r"^https://lms1\.example\.com/courses/(?P<course_id>.*)/course/?$",
                "JS_BACKEND": "openedx-hawthorn",
                "JS_COURSE_REGEX": r"^https://lms1\.example\.com/courses/(.*)/course/?$",
                "JS_NEXT_URL": "richie-site-a",
            },
            {
                "BASE_URL": "https://lms2.example.com",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_REGEX": r"^https://lms2\.example\.com/courses/(?P<course_id>.*)/course/?$",
                "JS_BACKEND": "openedx-hawthorn",
                "JS_COURSE_REGEX": r"^https://lms2\.example\.com/courses/(.*)/course/?$",
            },
        ]
    )
    def test_get_lms_context_multiple_backends_mixed_next_url(self):
        """
        With multiple backends, next_url should only appear for entries that define JS_NEXT_URL.
        """
        result = self.processor.get_lms_context()

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["next_url"], "richie-site-a")
        self.assertNotIn("next_url", result[1])
