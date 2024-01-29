"""
Tests for CourseRun API endpoints in the courses app with EDX LMS.
"""

# pylint: disable=too-many-lines
from unittest import mock

from django.test import override_settings

from cms.constants import PUBLISHER_STATE_DEFAULT
from cms.models import Title
from cms.signals import post_publish
from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseFactory
from richie.apps.courses.models import CourseRun


# pylint: disable=too-many-public-methods
@mock.patch.object(post_publish, "send", wraps=post_publish.send)
@override_settings(RICHIE_COURSE_RUN_SYNC_SECRETS=["shared secret"])
@override_settings(
    TIME_ZONE="utc",
    RICHIE_LMS_BACKENDS=[
        {
            "BASE_URL": "http://localhost:8071",
            "BACKEND": "richie.apps.courses.lms.joanie.JoanieBackend",
            "COURSE_REGEX": "^.*/api/(?P<resource_type>(course-runs|products))/(?P<resource_id>.*)/?$",  # noqa pylint: disable=line-too-long
        }
    ],
)
class JoanieSyncCourseRunApiTestCase(CMSTestCase):
    """Test calls to sync a course run from Joanie via API endpoint."""

    # To update the http authorizations add this next statements before the first assert
    # from richie.apps.courses.utils import get_signature
    # print (get_signature(self.client._encode_json(data, "application/json"), "shared secret"))

    def test_api_course_run_sync_joanie_succeed(self, mock_signal):
        """
        A course run synchronization through Joanie should succeed.
        """
        course = CourseFactory(code="DemoX", should_publish=False)
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)
        data = {
            "resource_link": "http://example.joanie:8071/api/course-runs/123",
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "course": "DemoX",
        }
        mock_signal.reset_mock()

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )

        authorization = (
            "SIG-HMAC-SHA256 "
            "98ee25a1f289f4bb1e2887455b02ff32bf1e45d64a72ac6c6f4e6feff80df0f2"
        )
        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=authorization,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)
