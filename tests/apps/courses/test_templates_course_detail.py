"""
End-to-end tests for the course detail view
"""
import re
from datetime import timedelta

from django.test.utils import override_settings
from django.utils import dateformat, timezone

import pytz
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
)


class CourseCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the course detail view

    It's worth to notice related draft items (Person, Organization) are only
    displayed on a draft course page so admin can preview them. But draft items are
    hidden from published page so common users can not see them.
    """

    def test_templates_course_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published course page
        """
        categories = CategoryFactory.create_batch(4)
        icons = CategoryFactory.create_batch(4, fill_icon=True)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            page_title="Very interesting course",
            fill_organizations=organizations,
            fill_categories=categories,
            fill_icons=icons,
        )
        page = course.extended_object
        # Create 2 ongoing open course runs
        now = timezone.now()
        course_run1, _course_run2 = CourseRunFactory.create_batch(
            2,
            page_parent=course.extended_object,
            start=now - timedelta(hours=1),
            end=now + timedelta(hours=2),
            enrollment_end=now + timedelta(hours=1),
            languages=["en", "fr"],
        )
        self.assertFalse(course_run1.extended_object.publish("en"))

        # Publish only 2 out of 4 categories, icons and organizations
        categories[0].extended_object.publish("en")
        categories[1].extended_object.publish("en")
        icons[0].extended_object.publish("en")
        icons[1].extended_object.publish("en")
        organizations[0].extended_object.publish("en")
        organizations[1].extended_object.publish("en")

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        categories[2].extended_object.publish("en")
        categories[2].extended_object.unpublish("en")
        icons[2].extended_object.publish("en")
        icons[2].extended_object.unpublish("en")
        organizations[2].extended_object.publish("en")
        organizations[2].extended_object.unpublish("en")

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        page.publish("en")

        # Now we can publish children course runs: publish only 1 of the 2
        course_run1.extended_object.parent_page.refresh_from_db()
        self.assertTrue(course_run1.extended_object.publish("en"))

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response, "<title>Very interesting course</title>", html=True
        )
        self.assertContains(
            response,
            '<h1 class="subheader__title">Very interesting course</h1>',
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

        # Only published icons should be present on the page
        pattern = (
            r'<a.*class="category-badge".*href="{link:s}".*>'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*icon\.jpg.*alt="{title:s}">'
            r'<span class="category-badge__title">'
            r".*{title:s}.*</span>"
        )

        for icon in icons[:2]:
            self.assertIsNotNone(
                re.search(
                    pattern.format(
                        link=icon.extended_object.get_absolute_url(),
                        title=icon.extended_object.get_title(),
                    ),
                    str(response.content),
                )
            )
        for icon in icons[-2:]:
            self.assertNotContains(response, icon.extended_object.get_title())

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

        # Only the published course run should be in response content
        self.assertContains(response, "<dd>English and french</dd>", html=True, count=1)

    def test_templates_course_detail_cms_draft_content(self):
        """
        A staff user should see a draft course including its draft elements with
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
        )
        page = course.extended_object
        now = timezone.now()
        course_run1, _course_run2 = CourseRunFactory.create_batch(
            2,
            page_parent=course.extended_object,
            start=now - timedelta(hours=1),
            end=now + timedelta(hours=2),
            enrollment_end=now + timedelta(hours=1),
            languages=["en", "fr"],
        )

        # Publish only 1 of the course runs
        course_run1.extended_object.publish("en")

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
            response, "<title>Very interesting course</title>", html=True
        )
        self.assertContains(
            response,
            '<h1 class="subheader__title">Very interesting course</h1>',
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
        # The draft and the published course runs should both be in the page
        self.assertContains(response, "<dd>English and french</dd>", html=True, count=2)

    def test_templates_course_detail_placeholder(self):
        """
        Draft editing course page should contain all key placeholders when empty.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        course = CourseFactory(page_title="Very interesting course")
        page = course.extended_object
        url = "{:s}?edit".format(page.get_absolute_url(language="en"))
        response = self.client.get(url)

        pattern = (
            r'<div class="course-detail__row course-detail__description">'
            r'<h2 class="course-detail__title">Description</h2>'
            r'<div class="cms-placeholder'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        pattern = (
            r'<div class="category-badge-list__container">'
            r'<div class="cms-placeholder'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        pattern = r'<div class="subheader__teaser"><div class="cms-placeholder'
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        pattern = (
            r'<div class="subheader__content subheader__content--aside">'
            r'<div class="cms-placeholder'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        pattern = (
            r'<div class="section__items section__items--organizations">'
            r'<div class="cms-placeholder'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        pattern = (
            r'<div class="section__items section__items--team">'
            r'<div class="cms-placeholder'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        pattern = (
            r'<div class="course-detail__row course-detail__information">'
            r'<div class="cms-placeholder'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        pattern = (
            r'<h3 class="course-detail__label">'
            r'License for the course content</h3><div class="cms-placeholder'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_templates_course_detail_no_index(self):
        """
        A course snapshot page should not be indexable by search engine robots.
        """
        course = CourseFactory(should_publish=True)
        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, '<meta name="robots" content="noindex">')

        snapshot = CourseFactory(
            page_parent=course.extended_object, should_publish=True
        )
        url = snapshot.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<meta name="robots" content="noindex">')

    def test_templates_course_detail_organization_main_logo(self):
        """The main organization logo should be present on the page with a link."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        organizations = OrganizationFactory.create_batch(
            2, fill_logo=True, should_publish=True
        )
        course = CourseFactory(fill_organizations=organizations)

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        pattern = (
            r'<a href="{url:s}" title="{title:s}" class="subheader__cartouche">'
            r'<div class="subheader__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x113'
        ).format(
            url=organizations[0].extended_object.get_absolute_url(),
            title=organizations[0].extended_object.get_title(),
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))


class RunsCourseCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the display of course runs on the course detail view.
    """

    def setUp(self):
        super().setUp()
        self.now = timezone.now()

    def create_run_ongoing_open(self, course, **kwargs):
        """
        Not a test. Create an on-going course run that is open for enrollment.
        """
        return CourseRunFactory(
            page_parent=course.extended_object,
            page_title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
            should_publish=True,
            **kwargs
        )

    def create_run_future_open(self, course, **kwargs):
        """
        Not a test. Create a course run in the future and open for enrollment.
        """
        return CourseRunFactory(
            page_parent=course.extended_object,
            page_title="my course run",
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
            should_publish=True,
            **kwargs
        )

    def create_run_future_not_yet_open(self, course):
        """
        Not a test. Create a course run in the future and not yet open for enrollment.
        """
        return CourseRunFactory(
            page_parent=course.extended_object,
            page_title="my course run",
            start=self.now + timedelta(hours=2),
            enrollment_start=self.now + timedelta(hours=1),
            should_publish=True,
        )

    def create_run_future_closed(self, course):
        """
        Not a test. Create a course run in the future and already closed for enrollment.
        """
        return CourseRunFactory(
            page_parent=course.extended_object,
            page_title="my course run",
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            should_publish=True,
        )

    def create_run_ongoing_closed(self, course):
        """
        Not a test. Create an on-going course run that is closed for enrollment.
        """
        return CourseRunFactory(
            page_parent=course.extended_object,
            page_title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
            enrollment_end=self.now,
            should_publish=True,
        )

    def create_run_archived(self, course):
        """
        Not a test. Create an archived course run.
        """
        return CourseRunFactory(
            page_parent=course.extended_object,
            page_title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now,
            should_publish=True,
        )

    @override_settings(LMS_BACKENDS=[])
    def test_templates_course_detail_runs_ongoing_open(self):
        """
        Priority 0: a course run open and on-going should always show up.
        """
        course = CourseFactory(page_title="my course", should_publish=True)
        self.create_run_ongoing_open(course)

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, "No open course runs")
        self.assertContains(
            response,
            (
                '<a href="/en/my-course/my-course-run/" '
                'class="course-run-enrollment__cta">Enroll now</a>'
            ),
            html=True,
        )
        self.assertNotContains(
            response,
            (
                '<div class="course-detail__row course-detail__runs '
                'course-detail__runs--inactive">'
                '<h3 class="course-detail__title">'
            ),
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
    def test_templates_course_detail_runs_ongoing_open_with_enrollments_app(self):
        """
        Priority 0: when the enrollments app is enabled, responsibility for the
        CTA is delegated to the frontend component.
        """
        course = CourseFactory(should_publish=True)
        course_run = self.create_run_ongoing_open(
            course,
            resource_link="http://edx:8073/courses/course-v1:edX+DemoX+Demo/course/",
        )
        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertIsNotNone(
            re.search(
                (
                    r'.*class="richie-react richie-react--course-run-enrollment".*'
                    r"data-props=\\\'{{\"courseRunId\": {}}}\\\'".format(
                        course_run.public_extension_id,
                    )
                ),
                str(response.content),
            )
        )

    @override_settings(LMS_BACKENDS=[])
    def test_templates_course_detail_runs_future_open(self):
        """
        Priority 1: an upcoming open course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course", should_publish=True)
        self.create_run_future_open(course)

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, "No open course runs")
        self.assertContains(
            response,
            (
                '<a href="/en/my-course/my-course-run/" '
                'class="course-run-enrollment__cta">Enroll now</a>'
            ),
            html=True,
        )
        self.assertNotContains(
            response,
            (
                '<div class="course-detail__row course-detail__runs '
                'course-detail__runs--inactive">'
                '<h3 class="course-detail__title">'
            ),
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
    def test_templates_course_detail_runs_future_open_with_enrollments_app(self):
        """
        Priority 1: when the enrollments app is enabled, responsibility for the
        CTA is delegated to the frontend component.
        """
        course = CourseFactory(should_publish=True)
        course_run = self.create_run_future_open(
            course,
            resource_link="http://edx:8073/courses/course-v1:edX+DemoX+Demo/course/",
        )
        response = self.client.get(course.extended_object.get_absolute_url())
        self.assertIsNotNone(
            re.search(
                (
                    r'.*class="richie-react richie-react--course-run-enrollment".*'
                    r"data-props=\\\'{{\"courseRunId\": {}}}\\\'".format(
                        course_run.public_extension_id,
                    )
                ),
                str(response.content),
            )
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_future_not_yet_open(self):
        """
        Priority 2: a future not yet open course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course", should_publish=True)
        course_run = self.create_run_future_not_yet_open(course)

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Upcoming</h3>', html=True
        )
        self.assertContains(
            response,
            '<ul class="course-detail__run-list">'
            '<li><a href="/en/my-course/my-course-run/">'
            "My course run, from {:s} to {:s}</a></li></ul>".format(
                dateformat.format(course_run.start, "N j, Y"),
                dateformat.format(course_run.end, "N j, Y"),
            ),
            html=True,
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_future_closed(self):
        """
        Priority 3: a future and closed course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course", should_publish=True)
        course_run = self.create_run_future_closed(course)

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Ongoing</h3>', html=True
        )
        self.assertContains(
            response,
            '<ul class="course-detail__run-list">'
            '<li><a href="/en/my-course/my-course-run/">'
            "My course run, from {:s} to {:s}</a></li></ul>".format(
                dateformat.format(course_run.start, "N j, Y"),
                dateformat.format(course_run.end, "N j, Y"),
            ),
            html=True,
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_ongoing_closed(self):
        """
        Priority 4: an ongoing and closed course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course", should_publish=True)
        course_run = self.create_run_ongoing_closed(course)

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Ongoing</h3>', html=True
        )
        self.assertContains(
            response,
            '<ul class="course-detail__run-list">'
            '<li><a href="/en/my-course/my-course-run/">'
            "My course run, from {:s} to {:s}</a></li></ul>".format(
                dateformat.format(course_run.start, "N j, Y"),
                dateformat.format(course_run.end, "N j, Y"),
            ),
            html=True,
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_archived(self):
        """
        Priority 5: an archived course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course", should_publish=True)
        course_run = self.create_run_archived(course)

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Archived</h3>', html=True
        )
        self.assertContains(
            response,
            '<ul class="course-detail__run-list">'
            '<li><a href="/en/my-course/my-course-run/">'
            "My course run, from {:s} to {:s}</a></li></ul>".format(
                dateformat.format(course_run.start, "N j, Y"),
                dateformat.format(course_run.end, "N j, Y"),
            ),
            html=True,
        )

    def test_templates_course_detail_runs_to_be_scheduled(self):
        """
        Priority 6: a course run with no date is only visible to staff users.
        """
        course = CourseFactory(page_title="my course", should_publish=True)
        CourseRunFactory(
            page_parent=course.extended_object,
            page_title="my course run",
            start=None,
            should_publish=True,
        )

        # Anonymous users should not see the course run
        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        # Staff users should see the course run
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">To be scheduled</h3>', html=True
        )
        self.assertContains(
            response,
            '<ul class="course-detail__run-list">'
            '<li><a href="/en/my-course/my-course-run/">My course run</a></li></ul>',
            html=True,
        )
