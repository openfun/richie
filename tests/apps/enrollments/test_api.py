"""Tests for the enrollments app API endpoints."""
from django.db import transaction

import arrow
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseRunFactory
from richie.apps.enrollments.factories import EnrollmentFactory
from richie.apps.enrollments.models import Enrollment


class EnrollmentsApiTestCase(CMSTestCase):
    """Test requests on courses app API endpoints."""

    def test_enrollment_create_anonymous_user(self):
        """
        Anonymous users cannot enroll in any course and should receive a Forbidden response.
        """
        course_run = CourseRunFactory(
            start=arrow.utcnow().shift(days=-5).datetime,
            end=arrow.utcnow().shift(days=+90).datetime,
            enrollment_start=arrow.utcnow().shift(days=-35).datetime,
            enrollment_end=arrow.utcnow().shift(days=+10).datetime,
        )
        response = self.client.post(
            "/api/v1.0/enrollments/", data={"course_run_id": course_run.id}
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            Enrollment.objects.filter(course_run=course_run).exists(), False
        )

    def test_enrollment_create_closed(self):
        """
        Attempting to enroll in a course that is not open for enrollment anymore results
        in an error.
        """
        user = UserFactory()
        course_run = CourseRunFactory(
            start=arrow.utcnow().shift(days=-35).datetime,
            end=arrow.utcnow().shift(days=+60).datetime,
            enrollment_start=arrow.utcnow().shift(days=-65).datetime,
            enrollment_end=arrow.utcnow().shift(days=-20).datetime,
        )

        self.client.force_login(user)
        response = self.client.post(
            "/api/v1.0/enrollments/", data={"course_run_id": course_run.id}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Course run is not open for enrollments."]}
        )

    def test_enrollment_create_already_enrolled(self):
        """
        A user cannot enroll in a course in which they are already enrolled.
        """
        user = UserFactory()
        course_run = CourseRunFactory(
            start=arrow.utcnow().shift(days=-5).datetime,
            end=arrow.utcnow().shift(days=+90).datetime,
            enrollment_start=arrow.utcnow().shift(days=-35).datetime,
            enrollment_end=arrow.utcnow().shift(days=+10).datetime,
        )
        EnrollmentFactory(user=user, course_run=course_run)

        self.client.force_login(user)
        with transaction.atomic():
            response = self.client.post(
                "/api/v1.0/enrollments/", data={"course_run_id": course_run.id}
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            Enrollment.objects.filter(user=user, course_run=course_run).count(), 1
        )

    def test_enrollment_create(self):
        """
        Course is open for enrollment and user can join it. Enrollment is successful.
        """
        user = UserFactory()
        course_run = CourseRunFactory(
            start=arrow.utcnow().shift(days=-5).datetime,
            end=arrow.utcnow().shift(days=+90).datetime,
            enrollment_start=arrow.utcnow().shift(days=-35).datetime,
            enrollment_end=arrow.utcnow().shift(days=+10).datetime,
        )

        with self.assertRaises(Enrollment.DoesNotExist):
            Enrollment.objects.get(user=user, course_run=course_run)

        self.client.force_login(user)
        response = self.client.post(
            "/api/v1.0/enrollments/", data={"course_run_id": course_run.id}
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Enrollment.objects.filter(user=user, course_run=course_run).exists()
        )

    def test_enrollment_retrieve_anonymous_user(self):
        """
        An anonymous user cannot retrieve an enrollment from anyone.
        """
        enrollment = EnrollmentFactory()
        response = self.client.get(
            f"/api/v1.0/enrollments/{enrollment.id}/", follow=True
        )
        self.assertEqual(response.status_code, 404)

    def test_enrollment_retrieve_other_logged_in_user(self):
        """
        A logged-in user cannot retrieve an enrollment from another user.
        """
        enrollment = EnrollmentFactory()

        user = UserFactory()
        self.client.force_login(user)
        response = self.client.get(
            f"/api/v1.0/enrollments/{enrollment.id}/", follow=True
        )
        self.assertEqual(response.status_code, 404)

    def test_enrollment_retrieve_user_themselves(self):
        """
        A logged-in user can retrieve one of their own enrollments.
        """
        enrollment = EnrollmentFactory()
        self.client.force_login(enrollment.user)
        response = self.client.get(
            f"/api/v1.0/enrollments/{enrollment.id}/", follow=True
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], enrollment.id)

    def test_enrollment_list_anonymous_user(self):
        """
        Anonymous users should get a 200 and an empty response, rather than an error, from the
        LIST enrollments endpoint.
        """
        EnrollmentFactory.create_batch(2)
        response = self.client.get("/api/v1.0/enrollments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_enrollment_list_only_current_user_enrollments(self):
        """
        A logged-in user can only see their own enrollments when they call the
        LIST enrollments endpoint.
        """
        enrollments = EnrollmentFactory.create_batch(2)
        self.client.force_login(enrollments[0].user)
        response = self.client.get("/api/v1.0/enrollments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["id"], enrollments[0].id)
