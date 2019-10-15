"""
End-to-end tests for the program detail view
"""
import re

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseFactory, ProgramFactory


class ProgramCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the program detail view
    """

    def test_templates_program_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published program page
        """
        courses = CourseFactory.create_batch(4)

        program = ProgramFactory(
            page_title="Preums",
            fill_cover=True,
            fill_excerpt=True,
            fill_body=True,
            fill_courses=courses,
        )
        page = program.extended_object

        # Publish only 2 out of 4 courses
        courses[0].extended_object.publish("en")
        courses[1].extended_object.publish("en")

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        courses[2].extended_object.publish("en")
        courses[2].extended_object.unpublish("en")

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish the program and ensure the content is correct
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Preums</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="program-detail__title">Preums</h1>', html=True
        )

        # Only published courses should be present on the page
        for course in courses[:2]:
            self.assertContains(
                response,
                '<p class="course-glimpse__content__title">{:s}</p>'.format(
                    course.extended_object.get_title()
                ),
                html=True,
            )
        for course in courses[-2:]:
            self.assertNotContains(response, course.extended_object.get_title())

    def test_templates_program_detail_cms_draft_content(self):
        """
        A staff user should see a draft program including its draft elements with an
        annotation.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        courses = CourseFactory.create_batch(4)
        program = ProgramFactory(
            page_title="Preums",
            fill_cover=True,
            fill_excerpt=True,
            fill_body=True,
            fill_courses=courses,
        )
        page = program.extended_object

        # Publish only 2 out of 4 courses
        courses[0].extended_object.publish("en")
        courses[1].extended_object.publish("en")

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        courses[2].extended_object.publish("en")
        courses[2].extended_object.unpublish("en")

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Preums</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="program-detail__title">Preums</h1>', html=True
        )

        # The published courses should be present on the page
        for course in courses[:2]:
            self.assertContains(
                response,
                '<p class="course-glimpse__content__title">{:s}</p>'.format(
                    course.extended_object.get_title()
                ),
                html=True,
            )
        # Draft courses should also be present on the page with an annotation for styling
        for course in courses[-2:]:
            self.assertIn(
                '<a class=" course-glimpse course-glimpse--link course-glimpse--draft " '
                'href="{:s}"'.format(course.extended_object.get_absolute_url()),
                re.sub(" +", " ", str(response.content).replace("\\n", "")),
            )
            self.assertContains(
                response,
                '<p class="course-glimpse__content__title">{title:s}</p>'.format(
                    title=course.extended_object.get_title()
                ),
                html=True,
            )
