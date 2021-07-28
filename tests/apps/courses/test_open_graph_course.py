"""
Test suite for the Open Graph for course pages
"""
import re

from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseFactory


class CourseOpenGraphTestCase(CMSTestCase):
    """Testing a course page open graph meta content values"""

    def setUp(self) -> None:
        self.cover_file_name = "cover.jpg"
        course = CourseFactory(
            page_title="Introduction to Programming",
            code="IntroProg",
            page_languages=["en", "fr"],
            fill_cover={
                "original_filename": self.cover_file_name,
            },
        )
        self.course_page = course.extended_object
        self.course_page.publish("en")

    def test_open_graph_course_meta_og_image(self):
        url = self.course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn(self.cover_file_name, html_meta_og_image)

    def test_open_graph_course_meta_og_image_width(self):
        url = self.course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image:width[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn("1200", html_meta_og_image)

    def test_open_graph_course_meta_og_image_height(self):
        url = self.course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image:height[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn("630", html_meta_og_image)
