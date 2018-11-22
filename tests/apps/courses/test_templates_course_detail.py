"""
End-to-end tests for the course detail view
"""
from unittest import mock

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    SubjectFactory,
)
from richie.apps.courses.models import CourseRun


class CourseCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the course detail view

    It's worth to notice related draft items (Person, Organization) are only
    displayed on a draft course page so admin can preview them. But draft items are
    hidden from published page so common users can not see them.
    """

    @mock.patch.object(
        CourseRun, "state", new_callable=mock.PropertyMock, return_value="is_open"
    )
    def test_templates_course_detail_cms_published_content(self, _):
        """
        Validate that the important elements are displayed on a published course page
        """
        subjects = SubjectFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            title="Very interesting course",
            fill_organizations=organizations,
            fill_subjects=subjects,
        )
        page = course.extended_object
        course_run1, _course_run2 = CourseRunFactory.create_batch(
            2, parent=course.extended_object, languages=["en", "fr"]
        )
        self.assertFalse(course_run1.extended_object.publish("en"))

        # Publish only 2 out of 4 subjects and 2 out of 4 organizations
        subjects[0].extended_object.publish("en")
        subjects[1].extended_object.publish("en")
        organizations[0].extended_object.publish("en")
        organizations[1].extended_object.publish("en")

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        subjects[2].extended_object.publish("en")
        subjects[2].extended_object.unpublish("en")
        organizations[2].extended_object.publish("en")
        organizations[2].extended_object.unpublish("en")

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        page.publish("en")

        # Now we can publish children course runs: publish only 1 of the 2
        course_run1.extended_object.parent_page.refresh_from_db()
        self.assertTrue(course_run1.extended_object.publish("en"))

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response, "<title>Very interesting course</title>", html=True
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__content__title">Very interesting course</h1>',
            html=True,
        )

        # Only published subjects should be present on the page
        for subject in subjects[:2]:
            self.assertContains(
                response,
                '<a class="subject-plugin-tag" href="{:s}">{:s}</a>'.format(
                    subject.extended_object.get_absolute_url(),
                    subject.extended_object.get_title(),
                ),
                html=True,
            )
        for subject in subjects[-2:]:
            self.assertNotContains(response, subject.extended_object.get_title())

        # Public organizations should be in response content
        for organization in organizations[:2]:
            self.assertContains(
                response,
                '<div class="organization-plugin__title">{title:s}</div>'.format(
                    title=organization.extended_object.get_title()
                ),
                html=True,
            )

        # Draft organizations should not be in response content
        for organization in organizations[-2:]:
            self.assertNotContains(
                response, organization.extended_object.get_title(), html=True
            )

        # Only the published course run should be in response content
        self.assertContains(response, "Enroll now", count=1)
        self.assertContains(response, "<dd>English, French</dd>", html=True, count=1)

    @mock.patch.object(
        CourseRun, "state", new_callable=mock.PropertyMock, return_value="is_open"
    )
    def test_templates_course_detail_cms_draft_content(self, _):
        """
        A staff user should see a draft course including its draft elements with
        an annotation
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        subjects = SubjectFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            title="Very interesting course",
            fill_organizations=organizations,
            fill_subjects=subjects,
        )
        page = course.extended_object
        course_run1, _course_run2 = CourseRunFactory.create_batch(
            2, parent=course.extended_object, languages=["en", "fr"]
        )

        # Publish only 1 of the course runs
        course_run1.extended_object.publish("en")

        # Publish only 2 out of 4 subjects and 2 out of 4 organizations
        subjects[0].extended_object.publish("en")
        subjects[1].extended_object.publish("en")
        organizations[0].extended_object.publish("en")
        organizations[1].extended_object.publish("en")

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        subjects[2].extended_object.publish("en")
        subjects[2].extended_object.unpublish("en")
        organizations[2].extended_object.publish("en")
        organizations[2].extended_object.unpublish("en")

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response, "<title>Very interesting course</title>", html=True
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__content__title">Very interesting course</h1>',
            html=True,
        )

        # Draft and public organizations should all be present on the page
        for organization in organizations:
            self.assertContains(
                response,
                '<div class="organization-plugin__title">{title:s}</div>'.format(
                    title=organization.extended_object.get_title()
                ),
                html=True,
            )

        # Draft organizations should be annotated for styling
        self.assertContains(response, "organization-plugin-container--draft", count=2)

        # The published subjects should be present on the page
        for subject in subjects[:2]:
            self.assertContains(
                response,
                '<a class="subject-plugin-tag" href="{:s}">{:s}</a>'.format(
                    subject.extended_object.get_absolute_url(),
                    subject.extended_object.get_title(),
                ),
                html=True,
            )
        # Draft subjects should also be present on the page with an annotation for styling
        for subject in subjects[-2:]:
            self.assertContains(
                response,
                '<a class="{element:s} {element:s}--draft" href="{url:s}">{title:s}</a>'.format(
                    url=subject.extended_object.get_absolute_url(),
                    element="subject-plugin-tag",
                    title=subject.extended_object.get_title(),
                ),
                html=True,
            )
        # The draft and the published course runs should both be in the page
        self.assertContains(response, "Enroll now", count=2)
        self.assertContains(response, "<dd>English, French</dd>", html=True, count=2)

    def test_templates_course_detail_no_index(self):
        """
        A course snapshot page should not be indexable by search engine robots.
        """
        course = CourseFactory(should_publish=True)
        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, '<meta name="robots" content="noindex">')

        snapshot = CourseFactory(parent=course.extended_object, should_publish=True)
        url = snapshot.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<meta name="robots" content="noindex">')
