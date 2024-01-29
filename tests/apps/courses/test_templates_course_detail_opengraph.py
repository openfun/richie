"""
Test suite for the Open Graph for course pages
"""

import re
from unittest import mock

from django.core.files.storage import FileSystemStorage
from django.test.utils import override_settings

from cms.api import add_plugin
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
            fill_cover={"original_filename": cover_file_name},
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
            fill_cover={"original_filename": cover_file_name},
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
            fill_cover={"original_filename": cover_file_name},
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

    def test_open_graph_course_description(self):
        """
        An opengraph description meta should be present if the introduction placeholder is set.
        """
        course = CourseFactory()
        course_page = course.extended_object

        # Add an introduction to the course
        placeholder = course_page.placeholders.get(slot="course_introduction")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="Introduction to interesting course",
        )
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertContains(
            response,
            '<meta property="og:description" content="Introduction to interesting course" />',
        )

    def test_open_graph_course_description_no_introduction(self):
        """
        A course with no introduction has no opengraph description meta.
        """
        course = CourseFactory(should_publish=True)

        url = course.extended_object.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertNotContains(response, "og:description")

    def test_open_graph_course_description_course_introduction_max_length(self):
        """
        The open graph description should be cut if it exceeds more than 200 caracters
        """
        course = CourseFactory()
        page = course.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. " * 5
        )

        # Add an course_introduction to the course
        placeholder = course.extended_object.placeholders.get(
            slot="course_introduction"
        )
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:200]
        self.assertContains(
            response,
            f'<meta property="og:description" content="{cut}" />',
        )

    @mock.patch.object(
        FileSystemStorage,
        "url",
        lambda storage_instance, name: f"https://test-bucket.s3.amazonaws.com/{name:s}",
    )
    def test_open_graph_course_meta_og_image_media_storage_url_full(self):
        """
        Test if the og:image of a course has the correct value when using a mocked django storage
        where each file is served from a AWS S3 URL like S3Boto3Storage.
        """
        course = CourseFactory(
            page_title="Introduction to Programming",
            code="IntroProg",
            page_languages=["en"],
            fill_cover=True,
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn(
            'content="https://test-bucket.s3.amazonaws.com/', html_meta_og_image
        )

    @mock.patch.object(
        FileSystemStorage,
        "url",
        lambda storage_instance, name: f"//my-cdn-user.cdn-provider.com/media/{name:s}",
    )
    def test_open_graph_course_meta_og_image_media_storage_url_double_slash(self):
        """
        Test if the og:image of a course has the correct value when using a mocked django storage
        where each file is served storage that generate URLs starting with a double slash.
        """
        course = CourseFactory(
            fill_cover=True,
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn(
            'content="http://my-cdn-user.cdn-provider.com/media/', html_meta_og_image
        )

    @mock.patch.object(
        FileSystemStorage,
        "url",
        lambda storage_instance, name: f"/media/{name:s}",
    )
    def test_open_graph_course_meta_og_image_media_storage_url_relative(self):
        """
        Test if the og:image of a course has the correct value when using a mocked django storage
        where each file is served from relative path.
        """
        course = CourseFactory(
            fill_cover=True,
        )
        course_page = course.extended_object
        course_page.publish("en")

        url = course_page.get_absolute_url(language="en")
        response = self.client.get(url)
        response_content = response.content.decode("UTF-8")

        match = re.search("<meta[^>]+og:image[^>]+>", response_content)
        html_meta_og_image = match.group(0)
        self.assertIn('content="http://example.com/media/', html_meta_og_image)
