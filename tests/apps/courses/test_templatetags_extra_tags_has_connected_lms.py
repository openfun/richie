"""
Unit tests for the `has_connected_lms` template filter.
"""
from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseRunFactory
from richie.apps.courses.templatetags.extra_tags import has_connected_lms


class HasConnectedLMSFilterTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the `has_connected_lms` template filter.
    """

    @override_settings(
        LMS_BACKENDS=[
            {
                "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
                "BASE_URL": "http://example.edx:8073",
                "API_TOKEN": "fakesecret",
            }
        ]
    )
    def test_course_run_has_connected_lms(self):
        """
        When there is a matching LMS backend, the filter returns True.
        """
        course_run = CourseRunFactory(
            resource_link="http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
        )
        self.assertEqual(has_connected_lms(course_run), True)

    @override_settings(LMS_BACKENDS=[])
    def test_course_run_has_no_connected_lms(self):
        """
        When there is no matching LMS backend, the filter returns False.
        """
        course_run = CourseRunFactory()
        self.assertEqual(has_connected_lms(course_run), False)
