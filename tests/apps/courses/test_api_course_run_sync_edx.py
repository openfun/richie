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

from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import CourseRun, CourseRunCatalogVisibility


# pylint: disable=too-many-public-methods
@mock.patch.object(post_publish, "send", wraps=post_publish.send)
@override_settings(RICHIE_COURSE_RUN_SYNC_SECRETS=["shared secret"])
@override_settings(
    TIME_ZONE="utc",
    RICHIE_LMS_BACKENDS=[
        {
            "BASE_URL": "http://localhost:8073",
            "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
            "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)/course/?$",
            "JS_BACKEND": "dummy",
            "JS_COURSE_REGEX": r"^.*/courses/(?<course_id>.*)/course/?$",
        }
    ],
)
class EdxSyncCourseRunApiTestCase(CMSTestCase):
    """Test calls to sync a course run from Open EdX via API endpoint."""

    # To update the http authorizations add this next statements before the first assert
    # from richie.apps.courses.utils import get_signature
    # print (get_signature(self.client._encode_json(data, "application/json"), "shared secret"))

    def test_api_course_run_sync_edx_succeed(self, mock_signal):
        """
        A course run synchronization through Open EdX LMS should succeed.
        """
        course = CourseFactory(code="DemoX", should_publish=False)
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 46782,
            "catalog_visibility": "course_and_search",
        }
        mock_signal.reset_mock()

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )

        authorization = (
            "SIG-HMAC-SHA256 "
            "5bdfb326b35fccaef9961e03cf617c359c86ffbb6c64e0f7e074aa011e8af9d6"
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

    def test_api_course_run_sync_edx_enrollment_count(self, mock_signal):
        """
        Check if the enrollment count of a course is updated
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(direct_course=course, resource_link=link)
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "enrollment_count": 865,
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 f510d35ba7492eb5c5133fab6bd2fa18328307089735a20f4a7f4a828e0598b5"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(course_run.enrollment_count, 865)
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_edx_catalog_visibility_course_only(self, mock_signal):
        """
        Verify that the catalog visibility is updated with `course_only`
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(direct_course=course, resource_link=link)
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "catalog_visibility": "course_only",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 c0c06e769ebb2d84ff14149f50aea5503ae192a4074f9c9b2478732a02936601"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_ONLY
        )
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_edx_catalog_visibility_course_and_search(
        self, mock_signal
    ):
        """
        Verify that the catalog visibility is updated with `course_and_search`
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(direct_course=course, resource_link=link)
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "catalog_visibility": "course_and_search",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 84583c2b96759c26ed1ecb3fc7d6d4805853cbbcd5ac40e777c0aa1c319fd490"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_AND_SEARCH
        )
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_edx_catalog_visibility_hidden(self, mock_signal):
        """
        Verify that the catalog visibility is updated with `hidden`
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(direct_course=course, resource_link=link)
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "catalog_visibility": "hidden",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 b18aaa037ac3c4630fb3d88597cf5138e8c145a10b912688de82ee2c963a7ed6"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.HIDDEN
        )
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_edx_catalog_visibility_none(self, mock_signal):
        """
        Test the adaptation of the Open edX catalog visibility of the `none` value to the Richie
        `hidden`.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(direct_course=course, resource_link=link)
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "catalog_visibility": "none",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 e9f23ed36de0865dbfd543ce1c83e0ec1700c8821cf6ff960ec549f2e6c4a6db"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.HIDDEN
        )
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_edx_catalog_visibility_both(self, mock_signal):
        """
        Test the adaptation of the Open edX catalog visibility of the `both` value to the Richie
        `course_and_search`.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(direct_course=course, resource_link=link)
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "catalog_visibility": "both",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 e93c38b636ec55fa4c1393f59e1758d53f55b0753737f3c451e4084ec10dd1ca"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_AND_SEARCH
        )
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_edx_catalog_visibility_about(self, mock_signal):
        """
        Test the adaptation of the Open edX catalog visibility of the `about` value to the Richie
        `course_only`.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(direct_course=course, resource_link=link)
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "catalog_visibility": "about",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 58f845704d268db96dfdcbd88a7f8a6f0124611fd741ec7a7eb6a12cd0af79f1"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_ONLY
        )
        self.assertFalse(mock_signal.called)
