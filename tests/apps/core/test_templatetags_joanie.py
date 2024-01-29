"""
Unit tests for the template tags related to Joanie.
"""

from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.core.templatetags.joanie import is_joanie_enabled


class JoanieTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the joanie template tags
    """

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "http://localhost:8071",
                "BACKEND": "richie.apps.courses.lms.joanie.JoanieBackend",
                "COURSE_REGEX": r"^.*$",
            }
        ]
    )
    def test_templatetags_is_joanie_enabled(self):
        """
        is_joanie_enabled should return True if
        an enabled lms backend with attribute `is_joanie` set to True.
        """
        self.assertTrue(is_joanie_enabled())

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "http://localhost:8071",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_REGEX": r"^.*$",
            }
        ]
    )
    def test_templatetags_is_joanie_enabled_without_backend_with_is_joanie_attribute(
        self,
    ):
        """
        is_joanie_enabled should return False if there is
        any enabled lms backend with attribute `is_joanie` set to True.
        """
        self.assertFalse(is_joanie_enabled())
