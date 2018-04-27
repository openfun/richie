"""
End-to-end tests for the course subject detail view
"""
from django.test import TestCase

from cms.api import create_page

from ..factories import CourseSubjectFactory
from ..models import CourseSubjectPage


class CourseSubjectCMSTestCase(TestCase):
    """
    End-to-end test suite to validate the content and Ux of the course subject detail view
    """

    def test_course_subject_cms_published_content(self):
        """
        Validate that the important elements are displayed once a page is published
        """
        course_subject = CourseSubjectFactory()

        page = create_page(
            "Very interesting thematic", "courses/cms/course_subject_detail.html", "en"
        )

        CourseSubjectPage.objects.create(
            course_subject=course_subject, extended_object=page
        )
        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response,
            "<title>Very interesting thematic</title>",
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<h1>Very interesting thematic</h1>", html=True)
