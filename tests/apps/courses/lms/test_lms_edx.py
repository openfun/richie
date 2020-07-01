"""Test suite for the EdX LMS backend."""
import json
import random

from django.test import TestCase
from django.test.utils import override_settings

import responses

from richie.apps.core.factories import UserFactory
from richie.apps.courses.lms import LMSHandler


@override_settings(
    LMS_BACKENDS=[
        {
            "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
            "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)/course/?$",
            "BASE_URL": "http://edx:8073",
            "API_TOKEN": "fakesecret",
        }
    ]
)
class TokenEdXLMSBackendTestCase(TestCase):
    """Test suite for the EdX LMS backend."""

    @responses.activate
    def test_lms_edx_set_enrollment_active(self):
        """Setting an enrollment with success."""
        user = UserFactory(username="teacher")

        responses.add(
            responses.POST,
            "http://edx:8073/api/enrollment/v1/enrollment",
            status=200,
            json={"is_active": True},
        )

        is_enrolled = LMSHandler.set_enrollment(
            user, "http://edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
        )

        self.assertEqual(len(responses.calls), 1)

        # Check API call to set enrollment
        self.assertEqual(
            responses.calls[0].request.url,
            "http://edx:8073/api/enrollment/v1/enrollment",
        )
        self.assertEqual(
            responses.calls[0].request.headers["X-Edx-Api-Key"], "fakesecret"
        )
        self.assertEqual(
            json.loads(responses.calls[0].request.body),
            {
                "user": user.username,
                "course_details": {"course_id": "course-v1:edX+DemoX+Demo_Course"},
            },
        )

        self.assertTrue(is_enrolled)

    @responses.activate
    def test_lms_edx_set_enrollment_inactive(self):
        """The enrollment attempt should return False if the server returns an inactive status."""
        user = UserFactory(username="teacher")

        responses.add(
            responses.POST,
            "http://edx:8073/api/enrollment/v1/enrollment",
            status=200,
            json={"is_active": False},
        )
        is_enrolled = LMSHandler.set_enrollment(
            user, "http://edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
        )

        self.assertEqual(len(responses.calls), 1)
        self.assertFalse(is_enrolled)

    @responses.activate
    def test_lms_edx_set_enrollment_error(self):
        """The enrollment attempt should return False if the server returns an error."""
        user = UserFactory(username="teacher")

        responses.add(
            responses.POST, "http://edx:8073/api/enrollment/v1/enrollment", status=404
        )
        is_enrolled = LMSHandler.set_enrollment(
            user, "http://edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
        )

        self.assertEqual(len(responses.calls), 1)
        self.assertFalse(is_enrolled)

    @responses.activate
    def test_lms_edx_get_enrollment_success(self):
        """Getting an enrollment with success."""
        expected_object = {"is_active": random.choice([True, False])}

        responses.add(
            responses.GET,
            (
                "http://edx:8073/api/enrollment/v1/enrollment/"
                "teacher,course-v1:edX+DemoX+Demo_Course"
            ),
            status=200,
            json=expected_object,
        )

        user = UserFactory(username="teacher")
        enrollment = LMSHandler.get_enrollment(
            user, "http://edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
        )

        self.assertEqual(len(responses.calls), 1)

        # Check API call to get enrollment
        self.assertEqual(
            responses.calls[0].request.url,
            (
                "http://edx:8073/api/enrollment/v1/enrollment/"
                "teacher,course-v1:edX+DemoX+Demo_Course"
            ),
        )
        self.assertEqual(
            responses.calls[0].request.headers["X-Edx-Api-Key"], "fakesecret"
        )
        self.assertEqual(responses.calls[0].request.body, None)

        self.assertEqual(enrollment, expected_object)

    @responses.activate
    def test_lms_edx_get_enrollment_error(self):
        """Getting an enrollment should return None if the server returns an error."""
        responses.add(
            responses.GET,
            (
                "http://edx:8073/api/enrollment/v1/enrollment/"
                "teacher,course-v1:edX+DemoX+Demo_Course"
            ),
            status=404,
        )

        user = UserFactory(username="teacher")
        enrollment = LMSHandler.get_enrollment(
            user, "http://edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
        )

        self.assertEqual(len(responses.calls), 1)
        self.assertIsNone(enrollment)
