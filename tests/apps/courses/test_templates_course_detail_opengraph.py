"""
Test suite for the Open Graph for course pages
"""
import re

from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseFactory


class TemplatesCourseDetailOpengraphCMSTestCase(CMSTestCase):
    """Testing a course page open graph meta content values"""

    def test_open_graph_course_meta_og_image(self):
        """
        Test if the og:image of a course has the correct value image url, width and height on the
        metas og:image og:image:width and og:image:heigth
        """
        cover_file_name = "cover.jpg"

        course = CourseFactory(
            page_title="Introduction to Programming",
            code="IntroProg",
            page_languages=["en", "fr"],
            fill_cover={
                "original_filename": cover_file_name,
            },
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn('content="http://example.com/media', html_meta_og_image)
        self.assertIn(cover_file_name, html_meta_og_image)

        match = re.search("<meta[^>]+og:image:width[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn(
            "1200",
            html_meta_og_image,
            msg="og:image:width should have the maximum permitted value of 1200",
        )

        match = re.search("<meta[^>]+og:image:height[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn(
            "630",
            html_meta_og_image,
            msg="og:image:height should have the maximum permitted value of 630",
        )

    @override_settings(MEDIA_URL="https://xyz.cloudfront.net/media/")
    def test_open_graph_course_meta_og_image_cdn_domain(self):
        """
        Test if the og:image of a course has the correct value when the MEDIA_URL setting is
        configured with a CDN.
        """
        cover_file_name = "cover.jpg"

        course = CourseFactory(
            page_title="Introduction to Programming",
            code="IntroProg",
            page_languages=["en", "fr"],
            fill_cover={
                "original_filename": cover_file_name,
            },
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn('content="https://xyz.cloudfront.net/media/', html_meta_og_image)
        self.assertIn(cover_file_name, html_meta_og_image)

    @override_settings(MEDIA_URL="//xyz.cloudfront.net/media/")
    def test_open_graph_course_meta_og_image_cdn_double_slash(self):
        """
        Test if the og:image of a course has the correct value when the MEDIA_URL setting is
        configured with a CDN that starts with a double slash
        """
        cover_file_name = "cover.jpg"

        course = CourseFactory(
            page_title="Introduction to Programming",
            code="IntroProg",
            page_languages=["en", "fr"],
            fill_cover={
                "original_filename": cover_file_name,
            },
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn('content="http://xyz.cloudfront.net/media/', html_meta_og_image)
        self.assertIn(cover_file_name, html_meta_og_image)

    def test_open_graph_course_no_cover_image(self):
        """
        Test if a course without a cover image has the default logo as og:image meta
        """
        course = CourseFactory(
            page_title="Introduction to Programming",
            code="IntroProg",
            page_languages=["en", "fr"],
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn("richie/images/logo.png", html_meta_og_image)

    @override_settings(STATIC_URL="https://xyz.cloudfront.net/static/")
    def test_open_graph_course_no_cover_image_with_cdn(self):
        """
        Test if a course without a cover image has the default logo as og:image meta when using a
        CDN
        """
        course = CourseFactory(
            page_title="Introduction to Programming",
            code="IntroProg",
            page_languages=["en", "fr"],
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn('content="https://xyz.cloudfront.net/static/', html_meta_og_image)
        self.assertIn("richie/images/logo.png", html_meta_og_image)
