"""
Tests for CourseRun API endpoints in the courses app.
"""

# pylint: disable=too-many-lines
from unittest import mock

from django.conf import settings
from django.test import override_settings

from cms.constants import PUBLISHER_STATE_DEFAULT, PUBLISHER_STATE_DIRTY
from cms.models import Page, Title
from cms.signals import post_publish
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import Course, CourseRun
from richie.apps.courses.serializers import SyncCourseRunSerializer
from richie.apps.courses.utils import get_signature


# pylint: disable=too-many-public-methods
@mock.patch.object(post_publish, "send", wraps=post_publish.send)
@override_settings(
    RICHIE_COURSE_RUN_SYNC_SECRETS=["shared secret"],
    RICHIE_LMS_BACKENDS=[
        {
            "BASE_URL": "http://localhost:8073",
            "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
            "COURSE_RUN_SYNC_NO_UPDATE_FIELDS": [],
            "COURSE_REGEX": r"^.*/courses/(?P<course_id>.*)/course/?$",
            "JS_BACKEND": "dummy",
            "JS_COURSE_REGEX": r"^.*/courses/(?<course_id>.*)/course/?$",
        }
    ],
)
class SyncCourseRunApiTestCase(CMSTestCase):
    """Test calls to sync a course run via API endpoint."""

    maxDiff = None

    def authorize(self, data):
        """
        Build the authorization header for the request.
        This is a helper method to avoid repeating the signature calculation in each test.
        """
        return get_signature(
            # pylint: disable=protected-access
            self.client._encode_json(data, "application/json"),
            settings.RICHIE_COURSE_RUN_SYNC_SECRETS[0],
        )

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
        self.assertEqual(response.json(), "Missing authentication.")
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
        self.assertEqual(response.json(), "Invalid authentication.")
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"resource_link": ["This field is required."]}
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"resource_link": ["Unknown course: DEMOX."]})
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(Course.objects.count(), 0)
        self.assertFalse(mock_signal.called)

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public", TIME_ZONE="UTC"
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public", TIME_ZONE="UTC"
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_draft", TIME_ZONE="UTC"
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(TIME_ZONE="UTC")
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"languages": ["This field is required."]})
        self.assertEqual(CourseRun.objects.count(), 0)
        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        self.assertFalse(mock_signal.called)

    @override_settings(TIME_ZONE="UTC")
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public",
        TIME_ZONE="UTC",
    )
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(TIME_ZONE="UTC")
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(TIME_ZONE="UTC")
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(TIME_ZONE="UTC")
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(TIME_ZONE="UTC")
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(TIME_ZONE="UTC")
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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
        TIME_ZONE="UTC",
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
    def test_api_course_run_sync_update_with_no_update_fields(self, mock_signal):
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
            "price": "59.99",
            "price_currency": "EUR",
            "offer": "paid",
            "certificate_price": "19.99",
            "certificate_offer": "paid",
            "discounted_price": "53.99",
            "discount": "-10%",
            "certificate_discounted_price": "27.98",
            "certificate_discount": "-30%",
        }

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
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

    @override_settings(
        TIME_ZONE="UTC",
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
    def test_api_course_run_sync_create_with_no_update_fields(self, mock_signal):
        """
        If a course run does not exist and LMS Backend has course run protected fields,
        these fields should still be used to create the course run.
        """
        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
        Title.objects.update(publisher_state=PUBLISHER_STATE_DEFAULT)
        mock_signal.reset_mock()

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
            HTTP_AUTHORIZATION=self.authorize(data),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

        # Check that the draft course run was created
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)

        for field, value in data.items():
            self.assertEqual(draft_serializer.data[field], value)

        self.assertFalse(mock_signal.called)

    # Bulk

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public", TIME_ZONE="UTC"
    )
    def test_api_course_run_sync_create_bulk_success(self, mock_signal):
        """
        It should be possible to synchronize a list of course runs in bulk.
        """
        course = CourseFactory(code="DemoX", should_publish=True)
        resource_link1 = (
            "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        )
        resource_link2 = (
            "http://example.edx:8073/courses/course-v1:edX+DemoX+02/course/"
        )
        data = [
            {
                "resource_link": resource_link1,
                "start": "2020-12-09T09:31:59.417817Z",
                "end": "2021-03-14T09:31:59.417895Z",
                "enrollment_start": "2020-11-09T09:31:59.417936Z",
                "enrollment_end": "2020-12-24T09:31:59.417972Z",
                "languages": ["en", "fr"],
                "enrollment_count": 46782,
                "catalog_visibility": "course_and_search",
                "price": "59.99",
                "price_currency": "EUR",
                "offer": "paid",
                "certificate_price": "19.99",
                "certificate_offer": "paid",
                "discounted_price": "53.99",
                "discount": "-10%",
                "certificate_discounted_price": "27.98",
                "certificate_discount": "-30%",
            },
            {
                "resource_link": resource_link2,
                "start": "2021-12-09T09:31:59.417817Z",
                "end": "2022-03-14T09:31:59.417895Z",
                "enrollment_start": "2021-11-09T09:31:59.417936Z",
                "enrollment_end": "2021-12-24T09:31:59.417972Z",
                "languages": ["en"],
                "enrollment_count": 210,
                "catalog_visibility": "course_and_search",
                "price": "59.99",
                "price_currency": "EUR",
                "offer": "paid",
                "certificate_price": "19.99",
                "certificate_offer": "paid",
                "discounted_price": "53.99",
                "discount": "-10%",
                "certificate_discounted_price": "27.98",
                "certificate_discount": "-30%",
            },
        ]

        mock_signal.reset_mock()

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {resource_link1: {"success": True}, resource_link2: {"success": True}},
        )
        self.assertEqual(CourseRun.objects.count(), 4)

        # Check that the draft course run was updated
        draft_course_runs = CourseRun.objects.filter(direct_course=course).order_by(
            "resource_link"
        )
        draft_serializer = SyncCourseRunSerializer(
            instance=draft_course_runs, many=True
        )
        self.assertEqual(draft_serializer.data, data)

        # Check that a new public course run was created
        public_course_runs = CourseRun.objects.filter(
            direct_course=course.public_extension
        ).order_by("resource_link")
        public_serializer = SyncCourseRunSerializer(
            instance=public_course_runs, many=True
        )
        self.assertEqual(public_serializer.data, data)

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public", TIME_ZONE="UTC"
    )
    def test_api_course_run_sync_create_bulk_missing_resource_link(self, _mock_signal):
        """
        If one resource link is missing, the whole synchronization cal should fail.
        """
        CourseFactory(code="DemoX", should_publish=True)
        resource_link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        data = [
            {
                "resource_link": resource_link,
                "start": "2020-12-09T09:31:59.417817Z",
                "end": "2021-03-14T09:31:59.417895Z",
                "enrollment_start": "2020-11-09T09:31:59.417936Z",
                "enrollment_end": "2020-12-24T09:31:59.417972Z",
                "languages": ["en", "fr"],
            },
            {
                # missing resource link
                "start": "2021-12-09T09:31:59.417817Z",
                "end": "2022-03-14T09:31:59.417895Z",
                "enrollment_start": "2021-11-09T09:31:59.417936Z",
                "enrollment_end": "2021-12-24T09:31:59.417972Z",
                "languages": ["en"],
            },
        ]

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"resource_link": ["This field is required."]}
        )
        self.assertFalse(CourseRun.objects.exists())

    @override_settings(TIME_ZONE="UTC")
    def test_api_course_run_sync_create_bulk_errors(self, mock_signal):
        """
        When errors occur on one of the course runs in bulk. The error is included
        in the document returned.
        """
        course = CourseFactory(code="DemoX", should_publish=True)
        resource_link1 = (
            "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        )
        resource_link2 = (
            "http://example.edx:8073/courses/course-v1:edX+DemoX+02/course/"
        )
        data = [
            {
                "resource_link": resource_link1,
                "start": 1,
                "end": "2021-03-14T09:31:59.417895Z",
                "enrollment_start": "2020-11-09T09:31:59.417936Z",
                "enrollment_end": "2020-12-24T09:31:59.417972Z",
                "languages": ["en", "fr"],
                "enrollment_count": 46782,
                "catalog_visibility": "course_and_search",
                "price": "59.99",
                "price_currency": "EUR",
                "offer": "paid",
                "certificate_price": "19.99",
                "certificate_offer": "paid",
                "discounted_price": "53.99",
                "discount": "-10%",
                "certificate_discounted_price": "27.98",
                "certificate_discount": "-30%",
            },
            {
                "resource_link": resource_link2,
                "start": "2021-12-09T09:31:59.417817Z",
                "end": "2022-03-14T09:31:59.417895Z",
                "enrollment_start": "2021-11-09T09:31:59.417936Z",
                "enrollment_end": "2021-12-24T09:31:59.417972Z",
                "languages": ["en"],
                "enrollment_count": 210,
                "catalog_visibility": "course_and_search",
                "price": "59.99",
                "price_currency": "EUR",
                "offer": "paid",
                "certificate_price": "19.99",
                "certificate_offer": "paid",
                "discounted_price": "53.99",
                "discount": "-10%",
                "certificate_discounted_price": "27.98",
                "certificate_discount": "-30%",
            },
        ]

        mock_signal.reset_mock()

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                resource_link1: {
                    "start": [
                        (
                            "Datetime has wrong format. Use one of these formats instead: "
                            "YYYY-MM-DDThh:mm[:ss[.uuuuuu]][+HH:MM|-HH:MM|Z]."
                        )
                    ]
                },
                resource_link2: {"success": True},
            },
        )
        self.assertEqual(CourseRun.objects.count(), 2)

        # Check that the draft course run of the valid item was updated
        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)
        self.assertDictEqual(draft_serializer.data, data[1])

        # Check that a new public course run of the valid item was created
        public_course_run = CourseRun.objects.get(direct_course=course.public_extension)
        public_serializer = SyncCourseRunSerializer(instance=public_course_run)
        self.assertEqual(public_serializer.data, data[1])

    def test_api_course_run_sync_create_course_run_on_course_page_with_snapshot(
        self, mock_signal
    ):
        """
        When a course run is created on a course page that has a snapshot, the course
        run should be created successfully.
        """
        course = CourseFactory(code="DemoX", should_publish=False)

        # Create a snapshot
        snapshot = CourseFactory(
            code="DemoX", page_parent=course.extended_object, should_publish=False
        )
        self.assertEqual(snapshot.is_snapshot, True)

        # Two courses with the same code should be created
        courses = Course.objects.filter(
            code="DEMOX", extended_object__publisher_is_draft=True
        )
        self.assertEqual(courses.count(), 2)
        self.assertEqual(CourseRun.objects.count(), 0)

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

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 1)

    def test_api_course_run_sync_create_course_run_on_published_course_page(
        self, mock_signal
    ):
        """
        When a course run is created on a published course page, the course run should
        be created successfully.
        """
        CourseFactory(code="DemoX", should_publish=True)

        # Two courses with the same code should be created
        Course.objects.get(code="DEMOX", extended_object__publisher_is_draft=True)
        Course.objects.get(code="DEMOX", extended_object__publisher_is_draft=False)
        self.assertEqual(CourseRun.objects.count(), 0)

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

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 2)

    def test_api_course_with_parent_courses_page(self, mock_signal):
        """
        Verify that a course is updated when it has a parent courses page.
        """
        mock_signal.reset_mock()
        courses_page = create_i18n_page(
            "Courses page",
            published=True,
            reverse_id="courses",
        )
        CourseFactory(code="DemoX", page_parent=courses_page, should_publish=False)

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

        response = self.client.post(
            "/api/v1.0/course-runs-sync",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})

    @override_settings(
        RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE="sync_to_public",
        TIME_ZONE="UTC",
    )
    def test_api_course_run_sync_price_info_as_optional(self, mock_signal):
        """
        Ensure the price information as optional
        """

        link = "http://example.edx:8073/courses/course-v1:edX+DemoX+01/course/"
        course = CourseFactory(code="DemoX")
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
            HTTP_AUTHORIZATION=self.authorize(data),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(CourseRun.objects.count(), 2)

        draft_course_run = CourseRun.objects.get(direct_course=course)
        draft_serializer = SyncCourseRunSerializer(instance=draft_course_run)

        self.assertEqual(draft_serializer.data["price_currency"], "EUR")
        self.assertEqual(draft_serializer.data["price"], None)
        self.assertEqual(draft_serializer.data["offer"], None)
        self.assertEqual(draft_serializer.data["certificate_price"], None)
        self.assertEqual(draft_serializer.data["certificate_offer"], None)

        public_course_run = CourseRun.objects.get(direct_course=course.public_extension)
        public_serializer = SyncCourseRunSerializer(instance=public_course_run)

        self.assertEqual(public_serializer.data["price_currency"], "EUR")
        self.assertEqual(public_serializer.data["price"], None)
        self.assertEqual(public_serializer.data["offer"], None)
        self.assertEqual(public_serializer.data["certificate_price"], None)
        self.assertEqual(public_serializer.data["certificate_offer"], None)

        self.assertEqual(
            course.extended_object.title_set.first().publisher_state,
            PUBLISHER_STATE_DEFAULT,
        )
        mock_signal.assert_called_once_with(
            sender=Page, instance=course.extended_object, language=None
        )
