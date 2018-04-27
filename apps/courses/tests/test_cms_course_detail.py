"""
End-to-end tests for the course detail view
"""
from django.test import TestCase

from cms.api import create_page

from ..factories import CourseFactory, CourseSubjectFactory
from ..models import CoursePage


class CourseCMSTestCase(TestCase):
    """
    End-to-end test suite to validate the content and Ux of the course detail view
    """

    def test_course_cms_published_content(self):
        """
        Validate that the important elements are displayed once a page is published
        """
        subject = CourseSubjectFactory()
        course = CourseFactory()
        course.subjects.add(subject)  # pylint: disable=no-member

        page = create_page(
            "Very interesting course", "courses/cms/course_detail.html", "en"
        )

        CoursePage.objects.create(course=course, extended_object=page)
        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response,
            "<title>Very interesting course</title>",
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<h1>Very interesting course</h1>", html=True)
        # course subject is present
        self.assertContains(
            response,
            "<ul><li>{subject_name}</li></ul>".format(subject_name=subject.name),
            html=True,
        )
        self.assertContains(
            response,
            "<span>{active_session}</span>".format(
                active_session=course.active_session
            ),
            html=True,
        )

    def test_course_cms_published_no_active_sesssion(self):
        """
        Validate detail page is correct when no active session exists
        """
        course = CourseFactory(active_session=None)

        page = create_page("Inactive course", "courses/cms/course_detail.html", "en")

        CoursePage.objects.create(course=course, extended_object=page)

        # Publish and ensure content is correct
        page.publish("en")
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Inactive course</title>", status_code=200, html=True
        )
        self.assertContains(response, "<h1>Inactive course</h1>", html=True)
        self.assertContains(
            response,
            "<span>No active session</span>".format(
                active_session=course.active_session
            ),
            html=True,
        )
