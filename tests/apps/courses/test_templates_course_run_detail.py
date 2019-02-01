"""
End-to-end tests for the course run detail view
"""
import random
from datetime import datetime
from unittest import mock

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    SubjectFactory,
)
from richie.apps.courses.models import CourseRun, CourseState


class CourseRunCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the course run detail view

    It's worth to notice related draft items (Person, Organization) are only
    displayed on a draft course page so admin can preview them. But draft items are
    hidden from published page so common users can not see them.
    """

    def test_templates_course_run_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published course run page
        """
        subjects = SubjectFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            page_title="Very interesting course",
            fill_organizations=organizations,
            fill_subjects=subjects,
            should_publish=True,
        )
        course_run = CourseRunFactory(
            page_title="first session",
            page_parent=course.extended_object,
            resource_link="https://www.example.com/enroll",
            enrollment_start=datetime(2018, 10, 21),
            enrollment_end=datetime(2019, 1, 18),
            start=datetime(2018, 12, 10),
            end=datetime(2019, 2, 14),
            languages=["en", "fr"],
        )
        page = course_run.extended_object

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

        # Now publish the page and check its content
        page.publish("en")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            "<title>First session - Very interesting course</title>",
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__content__title">'
            "Very interesting course<br>first session</h1>",
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

        # The course run details should be on the page
        self.assertContains(
            response, "<dt>Enrollment starts</dt><dd>Oct. 21, 2018</dd>"
        )
        self.assertContains(response, "<dt>Enrollment ends</dt><dd>Jan. 18, 2019</dd>")
        self.assertContains(response, "<dt>Course starts</dt><dd>Dec. 10, 2018</dd>")
        self.assertContains(response, "<dt>Course ends</dt><dd>Feb. 14, 2019</dd>")
        self.assertContains(response, "<dt>Languages</dt><dd>English, French</dd>")

    def test_templates_course_run_detail_cms_draft_content(self):
        """
        A staff user should see a draft course run including its draft elements with
        an annotation
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        subjects = SubjectFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            page_title="Very interesting course",
            fill_organizations=organizations,
            fill_subjects=subjects,
            should_publish=True,
        )
        course_run = CourseRunFactory(
            page_title="first session",
            page_parent=course.extended_object,
            resource_link="https://www.example.com/enroll",
            enrollment_start=datetime(2018, 10, 21),
            enrollment_end=datetime(2019, 1, 18),
            start=datetime(2018, 12, 10),
            end=datetime(2019, 2, 14),
            languages=["en", "fr"],
        )
        page = course_run.extended_object

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
            response,
            "<title>First session - Very interesting course</title>",
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__content__title">'
            "Very interesting course<br>first session</h1>",
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

        # The course run details should be on the page
        self.assertContains(
            response, "<dt>Enrollment starts</dt><dd>Oct. 21, 2018</dd>"
        )
        self.assertContains(response, "<dt>Enrollment ends</dt><dd>Jan. 18, 2019</dd>")
        self.assertContains(response, "<dt>Course starts</dt><dd>Dec. 10, 2018</dd>")
        self.assertContains(response, "<dt>Course ends</dt><dd>Feb. 14, 2019</dd>")
        self.assertContains(response, "<dt>Languages</dt><dd>English, French</dd>")

    def test_templates_course_run_detail_no_index(self):
        """
        A course run page should not be indexable by search engine robots.
        """
        course = CourseFactory(should_publish=True)
        course_run = CourseRunFactory(
            page_parent=course.extended_object, should_publish=True
        )

        url = course_run.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<meta name="robots" content="noindex">')

    def prepare_to_test_state(self, state):
        """
        Not a test.
        Create objects and mock to help testing the impact of the state on template rendering.
        """
        course = CourseFactory(should_publish=True)
        course_run = CourseRunFactory(
            page_parent=course.extended_object,
            resource_link="https://www.example.com/enroll",
            should_publish=True,
        )

        url = course_run.extended_object.get_absolute_url()
        with mock.patch.object(
            CourseRun, "state", new_callable=mock.PropertyMock, return_value=state
        ):
            response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        return response

    def test_templates_course_run_detail_state_with_cta(self):
        """A course run in a state with a call to action should include a link and the CTA."""
        response = self.prepare_to_test_state(
            CourseState(
                random.randint(0, 6),
                "state cta",
                random.choice(["state text", None]),
                random.choice([datetime.now(), None]),
            )
        )
        self.assertContains(
            response,
            '<a class="course-detail__content__run__block__cta" '
            'href="https://www.example.com/enroll">State cta</a>',
            html=True,
        )

    def test_templates_course_run_detail_state_without_cta(self):
        """A course run in a state without a call to action should include a state button."""
        response = self.prepare_to_test_state(
            CourseState(
                random.randint(0, 6),
                None,
                "state text",
                random.choice([datetime.now(), None]),
            )
        )
        self.assertContains(
            response,
            '<button class="course-detail__content__run__block__cta '
            'course-detail__content__run__block__cta--projected">State text</button>',
            html=True,
        )
