"""
End-to-end tests for the course detail view
"""
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    SubjectFactory,
)


class CourseCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the course detail view

    It's worth to notice related draft items (Person, Organization) are only
    displayed on a draft course page so admin can preview them. But draft items are
    hidden from published page so common users can not see them.
    """

    def test_templates_course_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published course page
        """
        subjects = SubjectFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            organization_main=organizations[0],
            title="Very interesting course",
            with_organizations=organizations,
            with_subjects=subjects,
        )
        page = course.extended_object
        course_runs = CourseRunFactory.create_batch(2, course=course)

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

        # Publish and ensure content is correct
        page.publish("en")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response, "<title>Very interesting course en</title>", html=True
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__title">Very interesting course en</h1>',
            html=True,
        )

        # Only published subjects should be present on the page
        for subject in subjects[:2]:
            self.assertContains(
                response,
                '<li class="course-detail__content__subjects__item">{:s}</li>'.format(
                    subject.extended_object.get_title()
                ),
                html=True,
            )
        for subject in subjects[-2:]:
            self.assertNotContains(response, subject.extended_object.get_title())

        # organization 1 is marked as main organization
        self.assertContains(
            response,
            '<li class="{element:s} {element:s}--main">{title:s}</li>'.format(
                element="course-detail__content__organizations__item",
                title=organizations[0].extended_object.get_title(),
            ),
            html=True,
        )

        # organization 2 is the only "common" org in listing
        self.assertContains(
            response,
            '<li class="course-detail__content__organizations__item">{:s}</li>'.format(
                organizations[1].extended_object.get_title()
            ),
            html=True,
        )

        # Draft organization should not be in response content
        for organization in organizations[-2:]:
            self.assertNotContains(
                response, organization.extended_object.get_title(), html=True
            )

        # Course runs should be in the page
        for course_run in course_runs:
            self.assertContains(
                response,
                '<a class="course-detail__aside__run__item__row__cta" href="{:s}">'.format(
                    course_run.resource_link
                ),
            )

    def test_templates_course_detail_cms_draft_content(self):
        """
        A staff user should see a draft course including its draft elements with
        an annotation
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        subjects = SubjectFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            organization_main=organizations[0],
            title="Very interesting course",
            with_organizations=organizations,
            with_subjects=subjects,
        )
        page = course.extended_object
        course_runs = CourseRunFactory.create_batch(2, course=course)

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
            response, "<title>Very interesting course en</title>", html=True
        )
        self.assertContains(
            response,
            '<h1 class="course-detail__title">Very interesting course en</h1>',
            html=True,
        )

        # organization 1 is marked as main and not duplicated
        self.assertContains(
            response,
            '<li class="{element:s} {element:s}--main">{title:s}</li>'.format(
                element="course-detail__content__organizations__item",
                title=organizations[0].extended_object.get_title(),
            ),
            html=True,
        )
        self.assertNotContains(
            response,
            (
                '<li class="course-detail__content__organizations__item">{:s}</li>'
            ).format(organizations[0].extended_object.get_title()),
            html=True,
        )
        # organization 2 is not marked as a draft since it has been published
        self.assertContains(
            response,
            '<li class="course-detail__content__organizations__item">{:s}</li>'.format(
                organizations[1].extended_object.get_title()
            ),
            html=True,
        )
        # Draft organizations should be present on the page with an annotation for styling
        for organization in organizations[:2]:
            self.assertNotContains(
                response,
                '<li class="{element:s} {element:s}--draft">{title:s}</li>'.format(
                    element="course-detail__content__organizations__item",
                    title=organization.extended_object.get_title(),
                ),
                html=True,
            )

        # The published subjects should be present on the page
        for subject in subjects[:2]:
            self.assertContains(
                response,
                '<li class="course-detail__content__subjects__item">{:s}</li>'.format(
                    subject.extended_object.get_title()
                ),
                html=True,
            )
        # Draft subjects should also be present on the page with an annotation for styling
        for subject in subjects[-2:]:
            self.assertContains(
                response,
                '<li class="{element:s} {element:s}--draft">{title:s}</li>'.format(
                    element="course-detail__content__subjects__item",
                    title=subject.extended_object.get_title(),
                ),
                html=True,
            )

        # Course runs should be in the page
        for course_run in course_runs:
            self.assertContains(
                response,
                '<a class="course-detail__aside__run__item__row__cta" href="{:s}">'.format(
                    course_run.resource_link
                ),
            )

    def test_templates_course_detail_cms_draft_content_draft_organization_main(self):
        """
        A draft main organization displayed on a draft page should be marked as both
        "main" and "draft"
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        course = CourseFactory(title="Very interesting course")
        page = course.extended_object

        url = page.get_absolute_url()
        response = self.client.get(url)

        # The main organization is only listed separately and also marked as draft
        self.assertContains(
            response,
            '<li class="{element:s} {element:s}--draft {element:s}--main">{title:s}</li>'.format(
                element="course-detail__content__organizations__item",
                title=course.organization_main.extended_object.get_title(),
            ),
            html=True,
        )
        self.assertNotContains(
            response,
            '<li class="{element:s} {element:s}--draft">{title:s}</li>'.format(
                element="course-detail__content__organizations__item",
                title=course.organization_main.extended_object.get_title(),
            ),
            html=True,
        )
