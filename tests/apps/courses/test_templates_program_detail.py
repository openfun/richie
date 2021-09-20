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
            response, '<h1 class="subheader__title">Preums</h1>', html=True
        )

        # Only published courses should be present on the page
        for course in courses[:2]:
            self.assertContains(
                response,
                f'<p class="course-glimpse__title">{course.extended_object.get_title():s}</p>',
                html=True,
            )
        for course in courses[-2:]:
            self.assertNotContains(response, course.extended_object.get_title())

    def test_templates_program_detail_cms_draft_content(self):
        """
        A staff user should see a draft program including draft elements.
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
        courses[3].extended_object.publish("en")
        courses[3].extended_object.unpublish("en")

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Preums</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="subheader__title">Preums</h1>', html=True
        )

        # Draft and published courses should be present on the page
        for course in courses[:2]:
            self.assertContains(
                response,
                '<a class="course-glimpse" '
                f'href="{course.extended_object.get_absolute_url():s}"',
            )
            self.assertContains(
                response,
                f'<p class="course-glimpse__title">{course.extended_object.get_title():s}</p>',
                html=True,
            )
        self.assertContains(
            response,
            '<a class="course-glimpse course-glimpse--draft" '
            f'href="{courses[2].extended_object.get_absolute_url():s}"',
        )
        self.assertContains(
            response,
            f'<p class="course-glimpse__title">{courses[2].extended_object.get_title():s}</p>',
            html=True,
        )
        # The unpublished course should not be present on the page
        self.assertNotContains(response, courses[3].extended_object.get_title())

    def test_templates_program_detail_cms_no_course(self):
        """
        Validate that a program without course doesn't show the course section
        on a published program page but does on the draft program page
        """
        program = ProgramFactory(
            page_title="Preums",
            fill_cover=True,
            fill_excerpt=True,
            fill_body=True,
        )
        page = program.extended_object

        # Publish the program and ensure the content is absent
        page.publish("en")
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertNotContains(
            response, '<div class="program-detail__courses program-detail__block">'
        )

        # The content should be visible as draft to the staff user
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")
        response = self.client.get(url)
        self.assertContains(
            response, '<div class="program-detail__courses program-detail__block">'
        )

    def test_templates_program_detail_cms_published_content_opengraph(self):
        """The program logo should be used as opengraph image."""
        program = ProgramFactory(
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
            should_publish=True,
        )
        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, '<meta property="og:type" content="website" />')
        self.assertContains(
            response, f'<meta property="og:url" content="http://example.com{url:s}" />'
        )
        pattern = (
            r'<meta property="og:image" content="http://example.com'
            r"/media/filer_public_thumbnails/filer_public/.*cover\.jpg__1200x630"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertContains(
            response, '<meta property="og:image:width" content="1200" />'
        )
        self.assertContains(
            response, '<meta property="og:image:height" content="630" />'
        )
