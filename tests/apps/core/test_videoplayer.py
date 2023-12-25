"""
Test the custom video player with a performance improvement.
"""
import random

import lxml.html  # nosec
from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import VIDEO_SAMPLE_LINKS, CourseFactory


class CoursesTemplatesCourseDetailRenderingCMSTestCase(CMSTestCase):
    """
    Test the custom video player with a performance improvement.
    """

    def test_templates_course_detail_teaser_video_cover_empty(self):
        """
        The `course_teaser` placeholder should return an `iframe` with an embedded `srcdoc`
        with a content of a link to the original external video service.
        """
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)  # nosec
        course = CourseFactory(fill_teaser=video_sample, should_publish=True)

        response = self.client.get(course.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        iframe = html.cssselect(".subheader__teaser .aspect-ratio iframe")[0]
        self.assertIn("html,body", iframe.get("srcdoc"))
        self.assertIn("allowfullscreen", iframe.keys())
        self.assertEqual(iframe.get("title"), video_sample.label)
        self.assertEqual(iframe.get("src"), video_sample.url)

        iframe_srcdoc_html = lxml.html.fromstring(iframe.get("srcdoc"))
        iframe_anchor = iframe_srcdoc_html.cssselect("a")[0]
        self.assertEqual(iframe_anchor.get("href"), video_sample.url + "?&autoplay=1")
