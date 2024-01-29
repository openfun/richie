"""
Test suite for the CourseCodeRedirectView.
"""

from django.conf import settings
from django.http import Http404
from django.urls import reverse

from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses import factories
from richie.apps.courses.views import CourseCodeRedirectView


class CourseCodeRedirectViewTestCase(CMSTestCase):
    """
    The CourseCodeRedirectView should redirect to the CMS course page
    from the course code, if the course page exists and is published.
    """

    def test_views_course_code_redirect_ok(self):
        """
        The CourseCodeRedirectView should redirect to the CMS course page.
        """
        course = factories.CourseFactory(should_publish=True)
        url = reverse(
            "redirect-course-code-to-course-url", kwargs={"course_code": course.code}
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, 301)
        self.assertEqual(
            response["Location"], course.extended_object.get_absolute_url()
        )

    def test_views_course_code_redirect_not_found(self):
        """
        The CourseCodeRedirectView should return a 404 if the course does not exist.
        """
        url = reverse(
            "redirect-course-code-to-course-url", kwargs={"course_code": "00000"}
        )

        request = self.client.get(url, follow=True)
        self.assertEqual(request.status_code, 404)

        # Under the hood, a Http404 exception is raised
        with self.assertRaises(Http404) as context:
            CourseCodeRedirectView().get(request, course_code="00000")

        self.assertEqual(str(context.exception), "No page found for course 00000.")

    def test_views_course_code_redirect_with_draft_only(self):
        """
        The CourseCodeRedirectView should return a 404 if the course is not published.
        """
        factories.CourseFactory(should_publish=False)
        url = reverse(
            "redirect-course-code-to-course-url", kwargs={"course_code": "00000"}
        )

        request = self.client.get(url, follow=True)
        self.assertEqual(request.status_code, 404)

        # Under the hood, a Http404 exception is raised
        with self.assertRaises(Http404) as context:
            CourseCodeRedirectView().get(request, course_code="00000")

        self.assertEqual(str(context.exception), "No page found for course 00000.")

    def test_views_course_code_redirect_with_multilingual_page(self):
        """
        If a Course page exists in multiple languages, the CourseCodeRedirectView should
        redirect to the page in the current language.
        """
        course = factories.CourseFactory(
            page_languages=["en", "fr"], should_publish=True
        )
        url = reverse(
            "redirect-course-code-to-course-url", kwargs={"course_code": course.code}
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, 301)
        self.assertEqual(
            response["Location"], course.extended_object.get_absolute_url(language="en")
        )

        # If the current language is French, the redirect should be on the French page
        self.client.cookies.load({settings.LANGUAGE_COOKIE_NAME: "fr"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 301)
        self.assertEqual(
            response["Location"], course.extended_object.get_absolute_url(language="fr")
        )

    def test_views_course_code_redirect_with_snapshot(self):
        """
        The CourseCodeRedirectView should redirect to the CMS course page property even
        if the page has snapshots.
        """
        course = factories.CourseFactory(should_publish=True)
        # Create a snapshot for the course page
        factories.CourseFactory(page_parent=course.extended_object, should_publish=True)

        url = reverse(
            "redirect-course-code-to-course-url", kwargs={"course_code": course.code}
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, 301)
        self.assertEqual(
            response["Location"], course.extended_object.get_absolute_url()
        )
