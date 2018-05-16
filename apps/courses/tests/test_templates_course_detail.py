"""
End-to-end tests for the course detail view
"""
from django.test import TestCase

from apps.core.factories import UserFactory

from ..factories import CourseFactory, OrganizationFactory, SubjectFactory


class CourseCMSTestCase(TestCase):
    """
    End-to-end test suite to validate the content and Ux of the course detail view
    """

    def test_course_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published course page
        """
        organization1, organization2, organization3 = OrganizationFactory.create_batch(
            3
        )
        subject1, subject2, subject3 = SubjectFactory.create_batch(3)
        course = CourseFactory(
            main_organization=organization1,
            title="Very interesting course",
            with_organizations=[organization1, organization2, organization3],
            with_subjects=[subject1, subject2, subject3],
        )
        page = course.extended_object

        # Publish only 2 out of 3 organizations and 2 out of 3 subjects
        organization1.extended_object.publish("en")
        organization2.extended_object.publish("en")
        subject1.extended_object.publish("en")
        subject2.extended_object.publish("en")

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response,
            "<title>Very interesting course</title>",
            status_code=200,
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__title">Very interesting course</h1>',
            html=True,
        )
        self.assertContains(
            response,
            '<div class="course-detail__active-session">{:s}</div>'.format(
                course.active_session
            ),
            html=True,
        )

        # Only published subjects should be present on the page
        for subject in [subject1, subject2]:
            self.assertContains(
                response,
                '<li class="course-detail__subjects__item">{:s}</li>'.format(
                    subject.extended_object.get_title()
                ),
                html=True,
            )
        self.assertNotContains(response, subject3.extended_object.get_title())

        # Only published organizations should be present on the page
        for organization in [organization1, organization2]:
            self.assertContains(
                response,
                '<li class="course-detail__organizations__item">{:s}</li>'.format(
                    organization.extended_object.get_title()
                ),
                html=True,
            )
        self.assertNotContains(response, organization3.extended_object.get_title())

    def test_course_cms_draft_content(self):
        """
        A staff user should see a draft course including its draft elements with an annotation
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        subject1, subject2, subject3 = SubjectFactory.create_batch(3)
        organization1, organization2, organization3 = OrganizationFactory.create_batch(
            3
        )
        course = CourseFactory(
            main_organization=organization1,
            title="Very interesting course",
            with_organizations=[organization1, organization2, organization3],
            with_subjects=[subject1, subject2, subject3],
        )
        page = course.extended_object

        # Publish only 2 out of 3 subjects and 2 out of 3 organizations
        subject1.extended_object.publish("en")
        subject2.extended_object.publish("en")
        organization1.extended_object.publish("en")
        organization2.extended_object.publish("en")

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response,
            "<title>Very interesting course</title>",
            status_code=200,
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__title">Very interesting course</h1>',
            html=True,
        )
        self.assertContains(
            response,
            '<div class="course-detail__active-session">{:s}</div>'.format(
                course.active_session
            ),
            html=True,
        )

        # Draft organization should be present on the page with an annotation for styling
        for organization in [organization1, organization2]:
            self.assertContains(
                response,
                '<li class="course-detail__organizations__item">{:s}</li>'.format(
                    organization.extended_object.get_title()
                ),
                html=True,
            )
        self.assertContains(
            response,
            '<li class="course-detail__organizations__item--draft">{:s}</li>'.format(
                organization3.extended_object.get_title()
            ),
            html=True,
        )

        # Draft subjects should be present on the page with an annotation for styling
        for subject in [subject1, subject2]:
            self.assertContains(
                response,
                '<li class="course-detail__subjects__item">{:s}</li>'.format(
                    subject.extended_object.get_title()
                ),
                html=True,
            )
        self.assertContains(
            response,
            '<li class="course-detail__subjects__item--draft">{:s}</li>'.format(
                subject3.extended_object.get_title()
            ),
            html=True,
        )

    def test_course_cms_published_no_active_sesssion(self):
        """
        Validate detail page is correct when no active session exists
        """
        course = CourseFactory(title="Inactive course", active_session=None)
        page = course.extended_object

        # Publish and ensure content is correct
        page.publish("en")
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Inactive course</title>", status_code=200, html=True
        )
        self.assertContains(
            response, '<h1 class="course-detail__title">Inactive course</h1>', html=True
        )
        self.assertContains(
            response,
            '<div class="course-detail__active-session">No active session</div>',
            html=True,
        )
