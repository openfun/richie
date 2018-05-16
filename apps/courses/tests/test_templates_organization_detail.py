"""
End-to-end tests for the organization detail view
"""
from django.test import TestCase

from apps.core.factories import UserFactory
from apps.courses.factories import CourseFactory

from ..factories import OrganizationFactory


class OrganizationCMSTestCase(TestCase):
    """
    End-to-end test suite to validate the content and Ux of the organization detail view
    """

    def test_organization_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published organization page
        """
        course1, course2, course3 = CourseFactory.create_batch(3)
        organization = OrganizationFactory(
            title="La Sorbonne",
            logo="my_logo.jpg",
            with_courses=[course1, course2, course3],
        )
        page = organization.extended_object

        # Publish only 2 out of 3 courses
        course1.extended_object.publish("en")
        course2.extended_object.publish("en")

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response, "<title>La Sorbonne</title>", html=True, status_code=200
        )
        self.assertContains(
            response,
            '<h1 class="organization-detail__title">La Sorbonne</h1>',
            html=True,
        )
        self.assertContains(
            response, '<img src="/media/my_logo.jpg" alt="La Sorbonne logo">', html=True
        )

        # Only published courses should be present on the page
        for course in [course1, course2]:
            self.assertContains(
                response,
                '<li class="organization-detail__courses__item">{:s}</li>'.format(
                    course.extended_object.get_title()
                ),
                html=True,
            )
        self.assertNotContains(response, course3.extended_object.get_title())

    def test_organization_cms_draft_content(self):
        """
        A staff user should see a draft organization including its draft elements with an
        annotation.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        course1, course2, course3 = CourseFactory.create_batch(3)
        organization = OrganizationFactory(
            title="La Sorbonne",
            logo="my_logo.jpg",
            with_courses=[course1, course2, course3],
        )
        page = organization.extended_object

        # Publish only 2 out of 3 courses
        course1.extended_object.publish("en")
        course2.extended_object.publish("en")

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>La Sorbonne</title>", html=True, status_code=200
        )
        self.assertContains(
            response,
            '<h1 class="organization-detail__title">La Sorbonne</h1>',
            html=True,
        )
        self.assertContains(
            response, '<img src="/media/my_logo.jpg" alt="La Sorbonne logo">', html=True
        )

        # The published courses should be present on the page
        for course in [course1, course2]:
            self.assertContains(
                response,
                '<li class="organization-detail__courses__item">{:s}</li>'.format(
                    course.extended_object.get_title()
                ),
                html=True,
            )
        # The draft course should also be present on the page with an annotation for styling
        self.assertContains(
            response,
            '<li class="organization-detail__courses__item--draft">{:s}</li>'.format(
                course3.extended_object.get_title()
            ),
            html=True,
        )
