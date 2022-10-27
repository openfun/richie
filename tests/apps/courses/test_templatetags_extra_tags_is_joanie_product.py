"""Tests for the `is_joanie_product` template filter."""
from django.test import TestCase, override_settings

from richie.apps.courses import factories
from richie.apps.courses.lms import LMSHandler
from richie.apps.courses.lms.joanie import JoanieBackend
from richie.apps.courses.templatetags.extra_tags import is_joanie_product


class IsJoanieProductFilterTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `is_joanie_product` template filter.
    """

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "http://localhost:8071",
                "BACKEND": "richie.apps.courses.lms.joanie.JoanieBackend",
                "COURSE_REGEX": "^.*/api/(?P<resource_type>(course-runs|products))/(?P<resource_id>.*)/?$",  # noqa pylint: disable=line-too-long
            }
        ]
    )
    def test_course_run_is_joanie_product(self):
        """
        It should return True if the provided course run has a resource_link which is
        a link to a product resource.
        """
        course_run = factories.CourseRunFactory(
            resource_link="http://localhost:8071/api/products/123"
        )
        self.assertEqual(is_joanie_product(course_run), True)

    @override_settings(
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "http://localhost:8071",
                "BACKEND": "richie.apps.courses.lms.joanie.JoanieBackend",
                "COURSE_REGEX": "^.*/api/(?P<resource_type>(course-runs|products))/(?P<resource_id>.*)/?$",  # noqa pylint: disable=line-too-long
            }
        ]
    )
    def test_course_run_is_not_joanie_product(self):
        """
        It should return False if the provided course run has a resource_link which is
        a resource managed by Joanie but not a link to a product resource.
        """
        course_run = factories.CourseRunFactory(
            resource_link="http://localhost:8071/api/course-runs/123"
        )
        lms = LMSHandler.select_lms(course_run.resource_link)
        self.assertIsInstance(lms, JoanieBackend)
        self.assertEqual(is_joanie_product(course_run), False)

    @override_settings(RICHIE_LMS_BACKENDS=[])
    def test_course_run_is_joanie_product_without_joanie_enabled(self):
        """
        It should return False if Joanie is not enabled
        """
        course_run = factories.CourseRunFactory(
            resource_link="http://localhost:8071/api/course-runs/123"
        )
        self.assertEqual(is_joanie_product(course_run), False)
