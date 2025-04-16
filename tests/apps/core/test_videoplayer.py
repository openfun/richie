"""
Test the custom video player with a performance improvement.
"""

from django.test.utils import override_settings

import lxml.html  # nosec
from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseFactory, ProgramFactory, VideoSample


class CoursesTemplatesCourseDetailRenderingCMSTestCase(CMSTestCase):
    """
    Test the custom video player with a performance improvement.
    """

    video_sample_without_image = VideoSample(
        "Anant Agarwal: Why massively open online courses (still) matter",
        None,
        "//www.youtube.com/embed/rYwTA5RA9eU",
    )

    @override_settings(RICHIE_VIDEO_PLUGIN_LAZY_LOADING=True)
    def test_templates_course_detail_teaser_video_cover_empty_lazy_play(self):
        """
        When the `course_teaser` placeholder is filled with a VideoPlayerPlugin.
        The course page should return an empty video cover image if:
        - the video poster image is empty;
        - the course page hasn't any `course_cover` placeholder.
        When the `RICHIE_VIDEO_PLUGIN_LAZY_LOADING` is activated, the video iframe should be
        hidden.
        """
        video_sample = self.video_sample_without_image
        course = CourseFactory(fill_teaser=video_sample, should_publish=True)
        response = self.client.get(course.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        iframe = html.cssselect(".subheader__teaser .aspect-ratio iframe")[0]
        self.assertEqual(iframe.get("data-src"), video_sample.url + "?&autoplay=1")
        self.assertEqual(iframe.get("title"), video_sample.label)
        self.assertEqual(iframe.get("style"), "display: none;")
        self.assertIn("allowfullscreen", iframe.keys())
        # no video cover image
        self.assertEqual(
            len(html.cssselect(".subheader__teaser .aspect-ratio a img")), 0
        )

    @override_settings(RICHIE_VIDEO_PLUGIN_LAZY_LOADING=True)
    def test_templates_course_detail_teaser_video_cover_from_course_cover(self):
        """
        When the `course_teaser` placeholder is filled with a VideoPlayerPlugin.
        The course page show the course cover image if:
        - the video poster image is empty;
        - the course page has a `course_cover` placeholder.
        When the `RICHIE_VIDEO_PLUGIN_LAZY_LOADING` is activated, the video iframe should be
        hidden.
        """
        cover_file_name = cover_file_name = "cover.jpg"
        video_sample = self.video_sample_without_image
        course = CourseFactory(
            fill_teaser=video_sample,
            fill_cover={"original_filename": cover_file_name},
            should_publish=True,
        )
        response = self.client.get(course.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        iframe = html.cssselect(".subheader__teaser .aspect-ratio iframe")[0]
        self.assertEqual(iframe.get("data-src"), video_sample.url + "?&autoplay=1")
        self.assertEqual(iframe.get("title"), video_sample.label)
        self.assertEqual(iframe.get("style"), "display: none;")
        self.assertIn("allowfullscreen", iframe.keys())
        img = html.cssselect(".subheader__teaser .aspect-ratio a img")[0]
        self.assertIn(cover_file_name, img.get("src"))

    @override_settings(RICHIE_VIDEO_PLUGIN_LAZY_LOADING=True)
    def test_templates_program_detail_teaser_video_cover_empty_lazy_play(self):
        """
        When the `program_teaser` placeholder is filled with a VideoPlayerPlugin.
        The program page should return an empty video cover image if:
        - the video poster image is empty;
        - the program page hasn't any `program_cover` placeholder.
        When the `RICHIE_VIDEO_PLUGIN_LAZY_LOADING` is activated, the video iframe should be
        hidden.
        """
        video_sample = self.video_sample_without_image
        program = ProgramFactory(fill_teaser=video_sample, should_publish=True)
        response = self.client.get(program.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        iframe = html.cssselect(".subheader__teaser .aspect-ratio iframe")[0]
        self.assertEqual(iframe.get("data-src"), video_sample.url + "?&autoplay=1")
        self.assertEqual(iframe.get("title"), video_sample.label)
        self.assertEqual(iframe.get("style"), "display: none;")
        self.assertIn("allowfullscreen", iframe.keys())
        # no video cover image
        self.assertEqual(
            len(html.cssselect(".subheader__teaser .aspect-ratio a img")), 0
        )

    @override_settings(RICHIE_VIDEO_PLUGIN_LAZY_LOADING=True)
    def test_templates_program_detail_teaser_video_cover_from_program_cover(self):
        """
        When the `program_teaser` placeholder is filled with a VideoPlayerPlugin,
        the program page should display the program cover image if:
        - the video poster image is empty;
        - the program page has a `program_cover` placeholder.
        When the `RICHIE_VIDEO_PLUGIN_LAZY_LOADING` setting is activated, the video iframe
        should be hidden, and the cover image should be displayed instead.
        """
        cover_file_name = cover_file_name = "cover.jpg"
        video_sample = self.video_sample_without_image
        program = ProgramFactory(
            fill_teaser=video_sample,
            fill_cover={"original_filename": cover_file_name},
            should_publish=True,
        )
        response = self.client.get(program.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        iframe = html.cssselect(".subheader__teaser .aspect-ratio iframe")[0]
        self.assertEqual(iframe.get("data-src"), video_sample.url + "?&autoplay=1")
        self.assertEqual(iframe.get("title"), video_sample.label)
        self.assertEqual(iframe.get("style"), "display: none;")
        self.assertIn("allowfullscreen", iframe.keys())
        img = html.cssselect(".subheader__teaser .aspect-ratio a img")[0]
        self.assertIn(cover_file_name, img.get("src"))
