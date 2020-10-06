"""
End-to-end tests for the course run detail view
"""
import re
from datetime import datetime
from unittest import mock

from django.test.utils import override_settings
from django.utils import timezone

import pytz
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
)
from richie.apps.courses.models import CourseRun, CourseState


class CourseRunCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the course run detail view

    It's worth to notice related draft items (Person, Organization) are only
    displayed on a draft course page so admin can preview them. But draft items are
    hidden from published page so common users can not see them.
    """

    def test_templates_course_run_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published course run page
        """
        categories = CategoryFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            page_title="Very interesting course",
            fill_organizations=organizations,
            fill_categories=categories,
            should_publish=True,
        )
        course_run = CourseRunFactory(
            page_title="first session",
            page_parent=course.extended_object,
            resource_link="https://www.example.com/enroll",
            enrollment_start=datetime(2018, 10, 21, tzinfo=pytz.utc),
            enrollment_end=datetime(2019, 1, 18, tzinfo=pytz.utc),
            start=datetime(2018, 12, 10, tzinfo=pytz.utc),
            end=datetime(2019, 2, 14, tzinfo=pytz.utc),
            languages=["en", "fr"],
        )
        page = course_run.extended_object

        # Publish only 2 out of 4 categories and 2 out of 4 organizations
        categories[0].extended_object.publish("en")
        categories[1].extended_object.publish("en")
        organizations[0].extended_object.publish("en")
        organizations[1].extended_object.publish("en")

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        categories[2].extended_object.publish("en")
        categories[2].extended_object.unpublish("en")
        organizations[2].extended_object.publish("en")
        organizations[2].extended_object.unpublish("en")

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Now publish the page and check its content
        page.publish("en")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            "<title>First session - Very interesting course</title>",
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="subheader__title">'
            "Very interesting course<br>first session</h1>",
            html=True,
        )

        # Only published categories should be present on the page
        for category in categories[:2]:
            self.assertContains(
                response,
                (
                    '<a class="category-badge" href="{:s}">'
                    '<span class="category-badge__title">{:s}</span></a>'
                ).format(
                    category.extended_object.get_absolute_url(),
                    category.extended_object.get_title(),
                ),
                html=True,
            )
        for category in categories[-2:]:
            self.assertNotContains(response, category.extended_object.get_title())

        # Public organizations should be in response content
        for organization in organizations[:2]:
            self.assertContains(
                response,
                '<div class="organization-glimpse__title">{title:s}</div>'.format(
                    title=organization.extended_object.get_title()
                ),
                html=True,
            )

        # Draft organizations should not be in response content
        for organization in organizations[-2:]:
            self.assertNotContains(
                response, organization.extended_object.get_title(), html=True
            )

        # The course run details should be on the page
        self.assertContains(
            response, "<strong>Enrollment starts</strong><span>Oct. 21, 2018</span>"
        )
        self.assertContains(
            response, "<strong>Enrollment ends</strong><span>Jan. 18, 2019</span>"
        )
        self.assertContains(
            response, "<strong>Course starts</strong><span>Dec. 10, 2018</span>"
        )
        self.assertContains(
            response, "<strong>Course ends</strong><span>Feb. 14, 2019</span>"
        )
        self.assertContains(
            response, "<strong>Languages</strong><span>English and french</span>"
        )

    def test_templates_course_run_detail_cms_draft_content(self):
        """
        A staff user should see a draft course run including its draft elements with
        an annotation
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        categories = CategoryFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            page_title="Very interesting course",
            fill_organizations=organizations,
            fill_categories=categories,
            should_publish=True,
        )
        course_run = CourseRunFactory(
            page_title="first session",
            page_parent=course.extended_object,
            resource_link="https://www.example.com/enroll",
            enrollment_start=datetime(2018, 10, 21, tzinfo=pytz.utc),
            enrollment_end=datetime(2019, 1, 18, tzinfo=pytz.utc),
            start=datetime(2018, 12, 10, tzinfo=pytz.utc),
            end=datetime(2019, 2, 14, tzinfo=pytz.utc),
            languages=["en", "fr"],
        )
        page = course_run.extended_object

        # Publish only 2 out of 4 categories and 2 out of 4 organizations
        categories[0].extended_object.publish("en")
        categories[1].extended_object.publish("en")
        organizations[0].extended_object.publish("en")
        organizations[1].extended_object.publish("en")

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        categories[2].extended_object.publish("en")
        categories[2].extended_object.unpublish("en")
        organizations[2].extended_object.publish("en")
        organizations[2].extended_object.unpublish("en")

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            "<title>First session - Very interesting course</title>",
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="subheader__title">'
            "Very interesting course<br>first session</h1>",
            html=True,
        )

        # Draft and public organizations should all be present on the page
        for organization in organizations:
            self.assertContains(
                response,
                '<div class="organization-glimpse__title">{title:s}</div>'.format(
                    title=organization.extended_object.get_title()
                ),
                html=True,
            )

        # Draft organizations should be annotated for styling
        self.assertContains(response, "organization-glimpse--draft", count=2)

        # The published categories should be present on the page
        for category in categories[:2]:
            self.assertContains(
                response,
                (
                    '<a class="category-badge" href="{:s}">'
                    '<span class="category-badge__title">{:s}</span></a>'
                ).format(
                    category.extended_object.get_absolute_url(),
                    category.extended_object.get_title(),
                ),
                html=True,
            )

        # Draft categories should also be present on the page with an annotation for styling
        for category in categories[-2:]:
            self.assertContains(
                response,
                (
                    '<a class="{element:s} {element:s}--draft" href="{url:s}">'
                    '<span class="category-badge__title">{title:s}</span></a>'
                ).format(
                    url=category.extended_object.get_absolute_url(),
                    element="category-badge",
                    title=category.extended_object.get_title(),
                ),
                html=True,
            )

        # The course run details should be on the page
        self.assertContains(
            response, "<strong>Enrollment starts</strong><span>Oct. 21, 2018</span>"
        )
        self.assertContains(
            response, "<strong>Enrollment ends</strong><span>Jan. 18, 2019</span>"
        )
        self.assertContains(
            response, "<strong>Course starts</strong><span>Dec. 10, 2018</span>"
        )
        self.assertContains(
            response, "<strong>Course ends</strong><span>Feb. 14, 2019</span>"
        )
        self.assertContains(
            response, "<strong>Languages</strong><span>English and french</span>"
        )

    def test_templates_course_run_detail_no_index(self):
        """
        A course run page should not be indexable by search engine robots.
        """
        course = CourseFactory(should_publish=True)
        course_run = CourseRunFactory(
            page_parent=course.extended_object, should_publish=True
        )

        url = course_run.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<meta name="robots" content="noindex">')

    def prepare_to_test_state(self, state, **kwargs):
        """
        Not a test.
        Create objects and mock to help testing the impact of the state on template rendering.
        """
        course = CourseFactory(should_publish=True)
        resource_link = kwargs.get("resource_link") or "https://www.example.com/enroll"
        course_run = CourseRunFactory(
            page_parent=course.extended_object,
            resource_link=resource_link,
            should_publish=True,
        )

        url = course_run.extended_object.get_absolute_url()
        with mock.patch.object(
            CourseRun, "state", new_callable=mock.PropertyMock, return_value=state
        ):
            response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        return (response, course_run)

    @override_settings(LMS_BACKENDS=[])
    def test_templates_course_run_detail_state_without_enrollments_app_with_cta(self):
        """A course run in a state with a call to action should include a link and the CTA."""
        response, _ = self.prepare_to_test_state(CourseState(0, timezone.now()))
        self.assertContains(
            response,
            '<a class="subheader__cta" '
            'href="https://www.example.com/enroll">Enroll now</a>',
            html=True,
        )

    @override_settings(LMS_BACKENDS=[])
    def test_templates_course_run_detail_state_without_enrollments_app_without_cta(
        self,
    ):
        """A course run in a state without a call to action should include a state button."""
        response, _ = self.prepare_to_test_state(CourseState(6))
        self.assertContains(
            response,
            '<button class="subheader__cta '
            'subheader__cta--projected">To be scheduled</button>',
            html=True,
        )

    @override_settings(
        LMS_BACKENDS=[
            {
                "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
                "SELECTOR_REGEX": r".*",
                "JS_COURSE_REGEX": r"^.*/courses/(?<course_id>.*)/course/?$",
                "JS_SELECTOR_REGEX": r".*",
                "BASE_URL": "http://edx:8073",
                "API_TOKEN": "fakesecret",
            }
        ]
    )
    def test_templates_course_run_detail_state_with_enrollments_app_with_cta(self):
        """A course run in a state with a call to action just calls the frontend component."""
        response, course_run = self.prepare_to_test_state(
            CourseState(0, timezone.now()),
            resource_link="http://edx:8073/courses/course-v1:edX+DemoX+Demo/course/",
        )
        self.assertIsNotNone(
            re.search(
                (
                    r'.*class="richie-react richie-react--course-run-enrollment".*'
                    r"data-props=\\\'{{\"courseRunId\": {}}}\\\'".format(
                        course_run.public_extension_id
                    )
                ),
                str(response.content),
            )
        )

    @override_settings(
        LMS_BACKENDS=[
            {
                "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
                "SELECTOR_REGEX": r".*",
                "JS_COURSE_REGEX": r"^.*/courses/(?<course_id>.*)/course/?$",
                "JS_SELECTOR_REGEX": r".*",
                "BASE_URL": "http://edx:8073",
                "API_TOKEN": "fakesecret",
            }
        ]
    )
    def test_templates_course_run_detail_state_with_enrollments_app_without_cta(self):
        """A course run in a state without a call to action just calls the frontend component."""
        response, course_run = self.prepare_to_test_state(
            CourseState(6, timezone.now()),
            resource_link="http://edx:8073/courses/course-v1:edX+DemoX+Demo/course/",
        )
        self.assertIsNotNone(
            re.search(
                (
                    r'.*class="richie-react richie-react--course-run-enrollment".*'
                    r"data-props=\\\'{{\"courseRunId\": {}}}\\\'".format(
                        course_run.public_extension_id
                    )
                ),
                str(response.content),
            )
        )

    # Breadcrumb

    def test_templates_course_run_detail_breadcrumb_below_course(self):
        """
        Validate the format of the breadcrumb on a course run directly placed below the course.
        """
        home_page = PageFactory(
            title__title="home", title__language="en", should_publish=True
        )
        search_page = PageFactory(
            title__title="courses",
            title__language="en",
            parent=home_page,
            should_publish=True,
        )
        course = CourseFactory(
            page_title="course name",
            page_parent=search_page,
            page_in_navigation=True,
            should_publish=True,
        )
        course_run = CourseRunFactory(
            page_title="session 42",
            page_parent=course.extended_object,
            should_publish=True,
        )
        response = self.client.get(course_run.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            (
                '<ul class="breadcrumbs__list">'
                '  <li class="breadcrumbs__item">You are here:</li>'
                '  <li class="breadcrumbs__item"><a href="/en/home/">home</a></li>'
                '  <li class="breadcrumbs__item"><a href="/en/home/courses/">courses</a></li>'
                '  <li class="breadcrumbs__item">'
                '    <a href="/en/home/courses/course-name/">course name</a>'
                "    </li>"
                '  <li class="breadcrumbs__item"><span class="active">session 42</span></li>'
                "</ul>"
            ),
            html=True,
        )

    def test_templates_course_run_detail_breadcrumb_below_snapshot(self):
        """
        Validate the format of the breadcrumb on a course run placed below a snapshot.
        """
        home_page = PageFactory(
            title__title="home", title__language="en", should_publish=True
        )
        search_page = PageFactory(
            title__title="courses",
            title__language="en",
            parent=home_page,
            should_publish=True,
        )
        course = CourseFactory(
            page_title="course name",
            page_parent=search_page,
            page_in_navigation=True,
            should_publish=True,
        )
        snapshot = CourseFactory(
            page_title="snapshot name",
            page_parent=course.extended_object,
            page_in_navigation=True,
            should_publish=True,
        )
        course_run = CourseRunFactory(
            page_title="session 42",
            page_parent=snapshot.extended_object,
            should_publish=True,
        )
        response = self.client.get(course_run.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            (
                '<ul class="breadcrumbs__list">'
                '  <li class="breadcrumbs__item">You are here:</li>'
                '  <li class="breadcrumbs__item"><a href="/en/home/">home</a></li>'
                '  <li class="breadcrumbs__item"><a href="/en/home/courses/">courses</a></li>'
                '  <li class="breadcrumbs__item">'
                '    <a href="/en/home/courses/course-name/">course name</a>'
                "    </li>"
                '  <li class="breadcrumbs__item"><span class="active">session 42</span></li>'
                "</ul>"
            ),
            html=True,
        )
