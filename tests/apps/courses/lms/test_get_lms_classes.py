"""Test suite for the Get LMS Classes function."""

from unittest import TestCase

from django.test import override_settings

from richie.apps.courses.lms import LMSHandler
from richie.apps.courses.lms.base import BaseLMSBackend
from richie.apps.courses.lms.edx import EdXLMSBackend
from richie.apps.courses.lms.joanie import JoanieBackend


class GetLMSClassesTestCase(TestCase):
    """Test suite for the Get LMS Classes function."""

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "BASE_URL": "https://edx.org",
            },
            {
                "COURSE_REGEX": r"^.*/moocs/(?P<course_id>.*)",
                "BACKEND": "richie.apps.courses.lms.base.BaseLMSBackend",
                "BASE_URL": "https://www.example.com",
            },
            {
                "BASE_URL": "https://www.joanie.org",
                "BACKEND": "richie.apps.courses.lms.joanie.JoanieBackend",
                "COURSE_REGEX": "^.*/api/(?P<resource_type>(course-runs|products))/(?P<resource_id>.*)/?$",  # noqa pylint: disable=line-too-long
            },
        ]
    )
    def test_get_lms_classes(self):
        """
        The "get_lms_classes" util function should return
        a set of all enabled backend classes.
        """
        classes = LMSHandler.get_lms_classes()

        self.assertSetEqual(classes, {BaseLMSBackend, JoanieBackend, EdXLMSBackend})
