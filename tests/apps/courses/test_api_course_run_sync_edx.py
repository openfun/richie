"""
Tests for CourseRun API endpoints in the courses app.
"""
# pylint: disable=too-many-lines
import json
from unittest import mock

from django.conf import settings
from django.test import override_settings

from cms.constants import PUBLISHER_STATE_DEFAULT, PUBLISHER_STATE_DIRTY
from cms.models import Page, Title
from cms.signals import post_publish
from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.lms.edx import SyncCourseRunSerializer
from richie.apps.courses.models import Course, CourseRun, CourseRunCatalogVisibility


# pylint: disable=too-many-public-methods
@mock.patch.object(post_publish, "send", wraps=post_publish.send)
@override_settings(RICHIE_COURSE_RUN_SYNC_SECRETS=["shared secret"])
class SyncCourseRunApiTestCase(CMSTestCase):
    """Test calls to sync a course run via API endpoint."""

    # To update the http authorizations add this next statements before the first assert
    # from richie.apps.courses.utils import get_signature
    # print (get_signature(self.client._encode_json(data, "application/json"), "shared secret"))

    def test_api_course_run_sync_missing_signature(self, mock_signal):
        """The course run synchronization API endpoint requires a signature."""
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
        }

        mock_signal.reset_mock()
        response = self.client.post(
            "/api/v1.0/course-runs-sync", data, content_type="application/json"
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.content), "Missing authentication.")
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(Course.objects.count(), 0)
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_invalid_signature(self, mock_signal):
        """The course run synchronization API endpoint requires a valid signature."""
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
        }

        mock_signal.reset_mock()
        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=("invalid authorization"),
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(json.loads(response.content), "Invalid authentication.")
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(Course.objects.count(), 0)
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_missing_resource_link(self, mock_signal):
        """
        If the data submitted is missing a resource link, it should return a 400 error.
        """
        # Data with missing resource link => invalid
        data = {
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
        }

        mock_signal.reset_mock()
        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 acee4804ff21eabe366ff6e04495591dfe32dffa7f1cd2d48c0f44beb9d5aa0d"
            ),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content), {"resource_link": ["This field is required."]}
        )
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(Course.objects.count(), 0)
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_invalid_field(self, mock_signal):
        """
        If the submitted data is invalid, the course run synchronization view should return
        a 400 error.
        """
        # Data with invalid start date value
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "start": 1,
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
        }

        mock_signal.reset_mock()
        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 38af01f97c1b6d078662de52a4785df7c09a16b426659af56f722f68c2035f95"
            ),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "start": [
                    (
                        "Datetime has wrong format. Use one of these formats instead: "
                        "YYYY-MM-DDThh:mm[:ss[.uuuuuu]][+HH:MM|-HH:MM|Z]."
                    )
                ]
            },
        )
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(Course.objects.count(), 0)
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_create_unknown_course(self, mock_signal):
        """
        If the submitted data is not related to an existing course run and the related course
        can't be found, the course run synchronization view should return a 400 error.
        """
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
        }

        mock_signal.reset_mock()
        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 338f7c262254e8220fea54467526f8f1f4562ee3adf1e3a71abaf23a20b739e4"
            ),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content), {"resource_link": ["Unknown course: DEMOX."]}
        )
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(Course.objects.count(), 0)
        self.assertFalse(mock_signal.called)

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public", TIME_ZONE="utc"
    )
    def test_api_course_run_sync_create_sync_to_public_draft_course(self, mock_signal):
        """
        If the submitted data is not related to an existing course run, a new course run should
        be created. If the related course is draft, the synchronization is limited to the draft
        course run and the course is not marked dirty (it will already be IRL...).

        Demonstrate calculating the signature.
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

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

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
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check the new draft course run
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public", TIME_ZONE="utc"
    )
    def test_api_course_run_sync_create_sync_to_public_published_course(
        self, mock_signal
    ):
        """
        If the submitted data is not related to an existing course run, a new course run should
        be created. If the related course has a public counterpart, the synchronization is
        applied a draft and a public course run.
        """
        course = CourseFactory(code="DemoX", should_publish=True)
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 324,
            "catalog_visibility": "course_and_search",
        }
        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 8e232f3a6071a10cded2740bdc71aed06aa637719d28f968c7b7d35eccd765f7"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 2)

        # Check the new draft course run
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        # Check the new public course run
        public_course_run = CourseRun.objects.get(direct_course=course.public_extension)
        public_serializer = SyncCourseRunSerializer(instance=public_course_run)
        self.assertEqual(public_serializer.data, data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.assert_called_once_with(
            sender=Page, instance=course.extended_object, language=None
        )

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_draft", TIME_ZONE="utc"
    )
    def test_api_course_run_sync_create_sync_to_draft(self, mock_signal):
        """
        If the submitted data is not related to an existing course run, a new course run should
        be created. In "sync_to_draft" mode, the synchronization should be limited to the draft
        course run, even if the related course is published.
        """
        course = CourseFactory(code="DemoX", should_publish=True)
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 47892,
            "catalog_visibility": "course_and_search",
        }
        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 bb453816becb5df16949b915dd577a2cabf734e4429bfbd3bdb727bde39c58b7"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check the new draft course run
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DIRTY,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_create_partial_required(self, mock_signal):
        """
        If the submitted data is not related to an existing course run and some required fields
        are missing, it should raise a 400.
        """
        course = CourseFactory(code="DemoX", should_publish=True)
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "end": "2021-03-14T09:31:59.417895Z",
        }
        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 1de9b46133a91eec3515d0df40f586b642cff16b79aa9d5fe4f7679a33767967"
            ),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content), {"languages": ["This field is required."]}
        )
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_create_partial_not_required(self, mock_signal):
        """
        If the submitted data is not related to an existing course run and some optional fields
        are missing, it should create the course run.
        """
        course = CourseFactory(code="DemoX")
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)
        data = {
            "resource_link": "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 45,
            "catalog_visibility": "course_and_search",
        }

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 723d3312759b6755bc8bbe05a9c2c719d2b4a3bdf381e2036a93119bf192aeda"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check the new draft course run
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        data.update({"start": None, "end": None, "enrollment_start": None})
        self.assertEqual(draft_serializer.data, data)

        # The page is not marked dirty because the course run is to be scheduled
        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_existing_published_manual(self, mock_signal):
        """
        If a course run exists in "manual" sync mode (draft and public versions), it should not
        be updated and course runs should not be created.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="manual"
        )
        course.extended_object.publish("en")
        course.refresh_from_db()

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        origin_data = SyncCourseRunSerializer(instance=course_run).data
        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 338f7c262254e8220fea54467526f8f1f4562ee3adf1e3a71abaf23a20b739e4"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 2)

        # Check that the existing draft course run was not updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, origin_data)

        # Check that the existing public course run was not updated
        public_course_run = CourseRun.objects.get(direct_course=course.public_extension)
        public_serializer = SyncCourseRunSerializer(instance=public_course_run)
        self.assertEqual(public_serializer.data, origin_data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        self.assertFalse(mock_signal.called)

    def test_api_course_run_sync_existing_draft_manual(self, mock_signal):
        """
        If a course run exists in "manual" sync mode (only draft version), it should not
        be updated and a new course run should not be created.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="manual"
        )
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        origin_data = SyncCourseRunSerializer(instance=course_run).data
        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 338f7c262254e8220fea54467526f8f1f4562ee3adf1e3a71abaf23a20b739e4"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check that the existing draft course run was not updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, origin_data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_existing_published_sync_to_public(self, mock_signal):
        """
        If a course run exists in "sync_to_public" mode (draft and public versions),
        it should be updated, draft and public versions.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="sync_to_public"
        )
        course.extended_object.publish("en")
        course.refresh_from_db()

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 15682,
            "catalog_visibility": "course_and_search",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 25de22f3674a207a2bd3923dcc5e302a21c9aac8eee7c835f084349da69d0472"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 2)

        # Check that the existing draft course run was updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        # Check that the existing public course run was updated
        public_course_run = CourseRun.objects.get(direct_course=course.public_extension)
        public_serializer = SyncCourseRunSerializer(instance=public_course_run)
        self.assertEqual(public_serializer.data, data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.assert_called_once_with(
            sender=Page, instance=course.extended_object, language=None
        )

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_existing_draft_sync_to_public(self, mock_signal):
        """
        If a course run exists in "sync_to_public" mode (only draft version), and the course
        does not exist in public version, the draft course run should be updated and the
        related course should not be marked dirty (it will already be IRL...).
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="sync_to_public"
        )
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 2042,
            "catalog_visibility": "course_and_search",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 6f85261b995a8ca78b5610cfe47fd6a0e321f26c671b606d12225bbea72fc8f0"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check that the draft course run was updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_existing_draft_with_public_course_sync_to_public(
        self, mock_signal
    ):
        """
        If a course run exists in "sync_to_public" mode (only draft version),
        but the course exists in public version, it should be updated, and a new public
        version should be created.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX", should_publish=True)
        CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="sync_to_public"
        )

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 103123,
            "catalog_visibility": "course_and_search",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 262963565518c85901059500b274568a4d5583d507c375604e9845083d5d7095"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 2)

        # Check that the draft course run was updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        # Check that a new public course run was created
        public_course_run = CourseRun.objects.get(direct_course=course.public_extension)
        public_serializer = SyncCourseRunSerializer(instance=public_course_run)
        self.assertEqual(public_serializer.data, data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.assert_called_once_with(
            sender=Page, instance=course.extended_object, language=None
        )

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_existing_published_sync_to_draft(self, mock_signal):
        """
        If a course run exists in "sync_to_draft" mode (draft and public versions),
        only the draft version should be udpated and the related course page should
        be marked dirty.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="sync_to_draft"
        )
        course.extended_object.publish("en")
        course.refresh_from_db()

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        origin_data = SyncCourseRunSerializer(instance=course_run).data
        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 542,
            "catalog_visibility": "course_and_search",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 db30268ee706fd147c6f04567faa88ed84fd06f08dbc944fff6c0a4973b06599"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 2)

        # Check that the draft course run was updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        # Check that the public course run was NOT updated
        public_course_run = CourseRun.objects.get(direct_course=course.public_extension)
        public_serializer = SyncCourseRunSerializer(instance=public_course_run)
        self.assertEqual(public_serializer.data, origin_data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DIRTY,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_existing_draft_sync_to_draft(self, mock_signal):
        """
        If a course run exists in "sync_to_draft" mode (only draft version),
        the draft version should be udpated, the related course page should
        be marked dirty and no public version should be created.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX", should_publish=True)
        CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="sync_to_draft"
        )

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 986,
            "catalog_visibility": "course_and_search",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 3bed4a7b1595f49957bd949ed0192d5f1416d4f6a1c409fc8b03b1a1ebad0f39"
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check that the draft course run was updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertEqual(draft_serializer.data, data)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DIRTY,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_existing_partial(self, mock_signal):
        """
        If a course run exists, it can be partially updated and the other fields should not
        be altered.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="sync_to_draft"
        )
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        origin_data = SyncCourseRunSerializer(instance=course_run).data
        data = {"resource_link": link, "end": "2021-03-14T09:31:59.417895Z"}

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 1de9b46133a91eec3515d0df40f586b642cff16b79aa9d5fe4f7679a33767967"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check that the draft course run was updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)

        self.assertEqual(draft_serializer.data["end"], data["end"])
        for field in draft_serializer.fields:
            if field == "end":
                continue
            self.assertEqual(draft_serializer.data[field], origin_data[field])

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DIRTY,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(
        TIME_ZONE="utc",
        RICHIE_LMS_BACKENDS=[
            {
                "BASE_URL": "http://localhost:8073",
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": ["languages", "start"],
                "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)/course/?$",
                "JS_BACKEND": "dummy",
                "JS_COURSE_REGEX": r"^.*/courses/(?<course_id>.*)/course/?$",
            }
        ],
    )
    def test_api_course_run_sync_with_no_update_fields(self, mock_signal):
        """
        If a course run exists and LMS Backend has course run protected fields,
        these fields should not be updated.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        course_run = CourseRunFactory(
            direct_course=course, resource_link=link, sync_mode="sync_to_draft"
        )
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.reset_mock()

        origin_data = SyncCourseRunSerializer(instance=course_run).data
        data = {
            "resource_link": link,
            "start": "2020-12-09T09:31:59.417817Z",
            "end": "2021-03-14T09:31:59.417895Z",
            "enrollment_start": "2020-11-09T09:31:59.417936Z",
            "enrollment_end": "2020-12-24T09:31:59.417972Z",
            "languages": ["en", "fr"],
            "enrollment_count": 12345,
            "catalog_visibility": "course_and_search",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=(
                "SIG-HMAC-SHA256 13433eb9159326b7d0f38ea86ab1ef8510ac4bc643d997d2ad01e349bee15570"
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check that the draft course run was updated except protected fields
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)

        no_update_fields = getattr(settings, "RICHIE_LMS_BACKENDS")[0].get(
            "COURSE_RUN_SYNC_NO_UPDATE_FIELDS"
        )
        for field in draft_serializer.fields:
            if field in no_update_fields:
                self.assertEqual(draft_serializer.data[field], origin_data[field])
            else:
                self.assertEqual(draft_serializer.data[field], data[field])

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DIRTY,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_enrollment_count(self, mock_signal):
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
        self.assertEqual(json.loads(response.content), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(course_run.enrollment_count, 865)
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_catalog_visibility_course_only(self, mock_signal):
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
        self.assertEqual(json.loads(response.content), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_ONLY
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_catalog_visibility_course_and_search(
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
        self.assertEqual(json.loads(response.content), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_AND_SEARCH
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_catalog_visibility_hidden(self, mock_signal):
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
        self.assertEqual(json.loads(response.content), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.HIDDEN
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_catalog_visibility_none(self, mock_signal):
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
        self.assertEqual(json.loads(response.content), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.HIDDEN
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_catalog_visibility_both(self, mock_signal):
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
        self.assertEqual(json.loads(response.content), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_AND_SEARCH
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="utc")
    def test_api_course_run_sync_catalog_visibility_about(self, mock_signal):
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
        self.assertEqual(json.loads(response.content), {"success": True})
        course_run.refresh_from_db()
        self.assertEqual(
            course_run.catalog_visibility, CourseRunCatalogVisibility.COURSE_ONLY
        )
        self.assertFalse(mock_signal.called)
