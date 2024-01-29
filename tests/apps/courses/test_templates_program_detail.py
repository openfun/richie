"""
End-to-end tests for the program detail view
"""

import re

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseFactory, ProgramFactory


class ProgramCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the program detail view
    """

    def test_templates_program_detail_open_graph_description_program_excerpt(self):
        """
        An opengraph description meta should be present if the program_excerpt placeholder is set.
        """
        program = ProgramFactory()
        page = program.extended_object

        # Add a excerpt to a program
        placeholder = program.extended_object.placeholders.get(slot="program_excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A program excerpt description",
        )
        page.publish("en")

        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta property="og:description" content="A program excerpt description" />',
        )

    def test_templates_program_detail_open_graph_description_program_excerpt_exceeds_max_length(
        self,
    ):
        """
        The open graph description should be cut if it exceeds more than 200 caracters
        """
        program = ProgramFactory()
        page = program.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. " * 8
        )

        # Add a excerpt to a program
        placeholder = program.extended_object.placeholders.get(slot="program_excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:200]
        self.assertContains(
            response,
            f'<meta property="og:description" content="{cut}" />',
        )

    def test_templates_program_detail_meta_description_empty_program_excerpt(self):
        """
        The opengraph description meta should be missing if the program_excerpt placeholder is not
        set.
        """
        program = ProgramFactory()
        page = program.extended_object
        page.publish("en")

        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            "og:description",
        )

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
            response,
            "<title>Preums - Program - example.com</title>",
            html=True,
            status_code=200,
        )
        self.assertContains(
            response, '<h1 class="subheader__title">Preums</h1>', html=True
        )

        # Only published courses should be present on the page
        for course in courses[:2]:
            self.assertContains(
                response,
                '<span class="course-glimpse__title-text">{0:s}</span>'.format(  # noqa pylint: disable=consider-using-f-string,line-too-long
                    course.extended_object.get_title()
                ),
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
            response,
            "<title>Preums - Program - example.com</title>",
            html=True,
            status_code=200,
        )
        self.assertContains(
            response, '<h1 class="subheader__title">Preums</h1>', html=True
        )

        # Draft and published courses should be present on the page
        for course in courses[:2]:
            self.assertContains(
                response,
                '<a class="course-glimpse__link" '
                f'href="{course.extended_object.get_absolute_url():s}"',
            )
            self.assertContains(
                response,
                '<span class="course-glimpse__title-text">{0:s}</span>'.format(  # noqa pylint: disable=consider-using-f-string,line-too-long
                    course.extended_object.get_title()
                ),
                html=True,
            )
        self.assertContains(
            response,
            '<div class="course-glimpse course-glimpse--draft">'
            '<div aria-hidden="true" class="course-glimpse__media">'
            f'<a tabindex="-1" href="{courses[2].extended_object.get_absolute_url():s}"',
        )

        self.assertContains(
            response,
            '<span class="course-glimpse__title-text">{0:s}</span>'.format(  # noqa pylint: disable=consider-using-f-string,line-too-long
                courses[2].extended_object.get_title()
            ),
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

    def test_templates_program_detail_meta_description(self):
        """
        The program meta description should show meta_description placeholder if defined
        """
        program = ProgramFactory()
        page = program.extended_object

        title_obj = page.get_title_obj(language="en")
        title_obj.meta_description = "A custom description of the program"
        title_obj.save()

        page.publish("en")

        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A custom description of the program" />',
        )

    def test_templates_program_detail_meta_description_program_excerpt(self):
        """
        The program meta description should show the program_excerpt if no meta_description is
        specified
        """
        program = ProgramFactory()
        page = program.extended_object

        # Add a excerpt to a program
        placeholder = program.extended_object.placeholders.get(slot="program_excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A program excerpt description",
        )
        page.publish("en")

        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A program excerpt description" />',
        )

    def test_templates_program_detail_meta_description_program_excerpt_exceeds_max_length(
        self,
    ):
        """
        The program meta description should show the program_excerpt if no meta_description is
        specified
        """
        program = ProgramFactory()
        page = program.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
        )

        # Add a excerpt to a program
        placeholder = program.extended_object.placeholders.get(slot="program_excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:160]
        self.assertContains(
            response,
            f'<meta name="description" content="{cut}" />',
        )

    def test_templates_program_detail_meta_description_empty(self):
        """
        The program meta description should not be present if neither the meta_description field
        on the page, nor the `program_excerpt` placeholder are filled
        """
        program = ProgramFactory()
        page = program.extended_object
        page.publish("en")

        url = program.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            '<meta name="description"',
        )
