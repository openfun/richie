"""
End-to-end tests for the course detail view
"""
import random
import re
from datetime import datetime, timedelta

from django.test.utils import override_settings
from django.utils import dateformat, timezone

import htmlmin
import pytz
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.courses.factories import (
    VIDEO_SAMPLE_LINKS,
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    ProgramFactory,
)
from richie.apps.courses.models import CourseRun
from richie.apps.demo.utils import pick_image

# pylint: disable=too-many-lines


class TemplatesCourseDetailRenderingCMSTestCase(CMSTestCase):
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
            code="12345",
            effort=[3, "hour"],
            page_title="Very interesting course",
            fill_organizations=organizations,
            fill_categories=categories,
            fill_icons=icons,
        )
        page = course.extended_object
        # Create an ongoing open course run that will be published (created before
        # publishing the page)
        now = timezone.now()
        CourseRunFactory(
            direct_course=course,
            start=now - timedelta(hours=1),
            end=now + timedelta(hours=2),
            enrollment_end=now + timedelta(hours=1),
            languages=["en", "fr"],
        )

        program_published, program_unpublished = ProgramFactory.create_batch(
            2, fill_courses=[course], should_publish=True
        )
        program_unpublished.extended_object.unpublish("en")

        # Publish only 2 out of 4 categories, icons and organizations
        self.assertTrue(categories[0].extended_object.publish("en"))
        self.assertTrue(categories[1].extended_object.publish("en"))
        self.assertTrue(icons[0].extended_object.publish("en"))
        self.assertTrue(icons[1].extended_object.publish("en"))
        self.assertTrue(organizations[0].extended_object.publish("en"))
        self.assertTrue(organizations[1].extended_object.publish("en"))

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        self.assertTrue(categories[2].extended_object.publish("en"))
        self.assertTrue(categories[2].extended_object.unpublish("en"))
        self.assertTrue(icons[2].extended_object.publish("en"))
        self.assertTrue(icons[2].extended_object.unpublish("en"))
        self.assertTrue(organizations[2].extended_object.publish("en"))
        self.assertTrue(organizations[2].extended_object.unpublish("en"))

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish and ensure content is correct
        self.assertTrue(page.publish("en"))

        # Create an unpublished ongoing open course run (created after
        # publishing the page)
        CourseRunFactory(
            direct_course=course,
            start=now - timedelta(hours=1),
            end=now + timedelta(hours=2),
            enrollment_end=now + timedelta(hours=1),
            languages=["en", "fr"],
        )

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response, "<title>Very interesting course</title>", html=True
        )
        self.assertContains(
            response,
            (
                f'<div class="subheader__code" property="courseCode" content="{course.code:s}">'
                f"Ref. {course.code:s}</div>"
            ),
            html=True,
        )
        self.assertContains(
            response,
            '<h1 class="subheader__title" property="name">Very interesting course</h1>',
            html=True,
        )

        # Only published categories should be present on the page
        for category in categories[:2]:
            self.assertContains(
                response,
                (
                    # pylint: disable=consider-using-f-string
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
                    # pylint: disable=consider-using-f-string
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
                # pylint: disable=consider-using-f-string
                '<div class="organization-glimpse__title" property="name">{title:s}</div>'.format(
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
        self.assertEqual(CourseRun.objects.count(), 3)
        self.assertContains(response, "<dd>English and french</dd>", html=True, count=1)

        # Only the published program should be in response content
        self.assertContains(response, "course-detail__programs")
        self.assertContains(response, "This course is part of a program")
        self.assertContains(
            response, program_published.extended_object.get_title(), html=True, count=1
        )
        self.assertNotContains(
            response, program_unpublished.extended_object.get_title()
        )

    def test_templates_course_detail_cms_published_content_no_code(self):
        """
        Validate that the corresponding markup is absent from the public page
        when the "code" field is not set.
        """
        course = CourseFactory(
            page_title="Very interesting course", should_publish=True, code=None
        )

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, "subheader__code")

    def test_templates_course_detail_cms_draft_content(self):
        """
        A staff user should see a draft course including only the related objects that
        are published.
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
        CourseRunFactory(
            direct_course=course,
            start=now - timedelta(hours=1),
            end=now + timedelta(hours=2),
            enrollment_end=now + timedelta(hours=1),
            languages=["en", "fr"],
        )

        program_published, program_unpublished = ProgramFactory.create_batch(
            2, fill_courses=[course], should_publish=True
        )
        program_unpublished.extended_object.unpublish("en")

        # Publish only 2 out of 4 categories and 2 out of 4 organizations
        self.assertTrue(categories[0].extended_object.publish("en"))
        self.assertTrue(categories[1].extended_object.publish("en"))
        self.assertTrue(organizations[0].extended_object.publish("en"))
        self.assertTrue(organizations[1].extended_object.publish("en"))

        # The unpublished objects may have been published and unpublished which puts them in a
        # status different from objects that have never been published.
        # We want to test both cases.
        self.assertTrue(categories[3].extended_object.publish("en"))
        self.assertTrue(categories[3].extended_object.unpublish("en"))
        self.assertTrue(organizations[3].extended_object.publish("en"))
        self.assertTrue(organizations[3].extended_object.unpublish("en"))

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response, "<title>Very interesting course</title>", html=True
        )
        self.assertContains(
            response,
            '<h1 class="subheader__title" property="name">Very interesting course</h1>',
            html=True,
        )
        self.assertContains(
            response,
            (
                f'<div class="subheader__code" property="courseCode" content="{course.code:s}">'
                f"Ref. {course.code:s}</div>"
            ),
            html=True,
        )

        # Draft and published organizations should be present on the page
        for organization in organizations[:3]:
            self.assertContains(
                response,
                # pylint: disable=consider-using-f-string
                '<div class="organization-glimpse__title" property="name">{title:s}</div>'.format(
                    title=organization.extended_object.get_title()
                ),
                html=True,
            )
        # The unpublished organization should not be present on the page
        self.assertNotContains(
            response, organizations[3].extended_object.get_title(), html=True
        )

        # Draft and published categories should be present on the page
        for category in categories[:2]:
            self.assertContains(
                response,
                (
                    # pylint: disable=consider-using-f-string
                    '<a class="category-badge" href="{:s}">'
                    '<span class="category-badge__title">{:s}</span></a>'
                ).format(
                    category.extended_object.get_absolute_url(),
                    category.extended_object.get_title(),
                ),
                html=True,
            )
        self.assertContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                '<a class="category-badge category-badge--draft" href="{:s}">'
                '<span class="category-badge__title">{:s}</span></a>'
            ).format(
                categories[2].extended_object.get_absolute_url(),
                categories[2].extended_object.get_title(),
            ),
            html=True,
        )
        # The unpublished category should not be present on the page
        self.assertNotContains(
            response, categories[3].extended_object.get_title(), html=True
        )
        # The course run should be in the page
        self.assertContains(response, "<dd>English and french</dd>", html=True, count=1)

        # Both programs should be in response content
        self.assertContains(response, "course-detail__programs")
        self.assertContains(response, "This course is part of programs")
        self.assertContains(
            response, program_published.extended_object.get_title(), html=True, count=1
        )
        self.assertContains(
            response,
            program_unpublished.extended_object.get_title(),
            html=True,
            count=1,
        )

    def test_templates_course_detail_cms_draft_content_no_code(self):
        """
        Validate that the code is replaced by "..." on the draft page when the "code"
        field is not set.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        course = CourseFactory(page_title="Very interesting course", code=None)

        # The page should be visible as draft to the staff user
        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<div class="subheader__code" property="courseCode" content="">Ref. ...</div>',
            html=True,
        )

    def test_templates_course_detail_placeholder(self):
        """
        Draft editing course page should contain all key placeholders when empty.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        course = CourseFactory(page_title="Very interesting course")
        page = course.extended_object
        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"
        response = self.client.get(url)

        pattern = (
            r'<div class="course-detail__row course-detail__description">'
            r'<h2 class="course-detail__title">Description</h2>'
            r'<div property="description"><div class="cms-placeholder'
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
            r'<div class="subheader__content">'
            r'<div class="characteristics">'
            r"<ul.*</ul>"
            r'</div><div property="description">'
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
        content = htmlmin.minify(
            response.content.decode("UTF-8"), remove_optional_attribute_quotes=False
        )

        self.assertEqual(response.status_code, 200)
        pattern = (
            r'<a href="{url:s}" title="{title:s}" class="subheader__cartouche" '
            r'property="provider" typeof="CollegeOrUniversity">'
            r'<meta property="name" content="{title:s}">'
            r'<meta property="url" content="http://example.com{url:s}">'
            r'<div class="subheader__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x113'
        ).format(  # pylint: disable=consider-using-f-string
            url=organizations[0].extended_object.get_absolute_url(),
            title=organizations[0].extended_object.get_title(),
        )
        self.assertIsNotNone(re.search(pattern, str(content)))

    def test_templates_course_detail_no_programs(self):
        """
        If the course is not part of any program, the section should be hidden.
        """
        course = CourseFactory(should_publish=True)
        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "course-detail__programs")

    def test_templates_course_detail_teaser_empty_cover_empty_edit(self):
        """
        Without video in `course_teaser` placeholder and no image in `course_cover` placeholder,
        no component should be present on the `course_teaser` placeholder.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")
        course = CourseFactory()

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        pattern = (
            r'<div class="subheader__teaser">'
            r'<p class="empty">'
            r"Add a teaser video or add a cover image below"
            r" and it will be used as teaser image as well."
            r"</p>"
            r"</div>"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_templates_course_detail_teaser_empty_cover_empty(self):
        """
        Without video in `course_teaser` placeholder and no image in `course_cover` placeholder,
        no component should be present on the `course_teaser` placeholder.
        """
        course = CourseFactory(should_publish=True)

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        pattern = r'<div class="subheader__teaser"></div>'
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_templates_course_detail_teaser_video_cover_empty(self):
        """
        With video in `course_teaser` placeholder and no image in `course_cover` placeholder,
        video component should be present on the `course_teaser` placeholder.
        """
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)
        course = CourseFactory(fill_teaser=video_sample, should_publish=True)

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        pattern = (
            r'<div class="subheader__teaser">'
            r'<div class="aspect-ratio">'
            fr'<iframe src="{video_sample.url:s}"  allowfullscreen></iframe>'
            r"</div>"
            r"</div>"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_templates_course_detail_teaser_empty_cover_image(self):
        """
        Without video in `course_teaser` placeholder and with image in `course_cover` placeholder,
        image component should be present on the `course_teaser` placeholder.
        """
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)
        course = CourseFactory(
            fill_cover=pick_image("cover")(video_sample.image), should_publish=True
        )

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        pattern = (
            fr'<div class="subheader__teaser"><img.*/{video_sample.image:s}.*/></div>'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_templates_course_detail_teaser_video_cover_image(self):
        """
        With video in `course_teaser` placeholder and with image in `course_cover` placeholder,
        video component should be present on the `course_teaser` placeholder.
        """
        video_sample = random.choice(VIDEO_SAMPLE_LINKS)
        course = CourseFactory(
            fill_teaser=video_sample,
            fill_cover=pick_image("cover")(video_sample.image),
            should_publish=True,
        )

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        pattern = (
            r'<div class="subheader__teaser">'
            r'<div class="aspect-ratio">'
            fr'<iframe src="{video_sample.url:s}"  allowfullscreen></iframe>'
            r"</div>"
            r"</div>"
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
            direct_course=course,
            title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
            **kwargs,
        )

    def create_run_future_open(self, course, **kwargs):
        """
        Not a test. Create a course run in the future and open for enrollment.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
            **kwargs,
        )

    def create_run_future_not_yet_open(self, course):
        """
        Not a test. Create a course run in the future and not yet open for enrollment.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now + timedelta(hours=2),
            enrollment_start=self.now + timedelta(hours=1),
        )

    def create_run_future_closed(self, course):
        """
        Not a test. Create a course run in the future and already closed for enrollment.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
        )

    def create_run_ongoing_closed(self, course):
        """
        Not a test. Create an on-going course run that is closed for enrollment.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
            enrollment_end=self.now,
        )

    def create_run_archived_open(self, course):
        """
        Not a test. Create an archived open course run.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now + timedelta(hours=1),
        )

    def create_run_archived_closed(self, course):
        """
        Not a test. Create an archived closed course run.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now - timedelta(hours=1),
        )

    @override_settings(RICHIE_LMS_BACKENDS=[])
    def test_templates_course_detail_runs_ongoing_open(self):
        """
        Priority 0: a course run open and on-going should always show up.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_ongoing_open(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, "No open course runs")
        self.assertContains(
            response,
            (
                f'<a href="{course_run.resource_link:s}" '
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
        RICHIE_LMS_BACKENDS=[
            {
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "JS_BACKEND": "openedx-hawthorn",
                "COURSE_REGEX": r".*",
                "JS_COURSE_REGEX": r"^.*/courses/(?<course_id>.*)/course/?$",
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
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(
            course,
            resource_link="http://edx:8073/courses/course-v1:edX+DemoX+Demo/course/",
        )
        self.assertTrue(course.extended_object.publish("en"))
        course_run.refresh_from_db()

        response = self.client.get(course.extended_object.get_absolute_url())

        # pylint: disable=consider-using-f-string
        pattern = r".*data-props=\"{{.*{}.*{}.*{}.*{}.*{}.*{}.*{}.*}}\"".format(
            "courseRun",
            "id",
            course_run.public_course_run.id,
            "resource_link",
            re.escape(course_run.public_course_run.resource_link),
            "priority",
            course_run.public_course_run.state["priority"],
        )

        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertContains(
            response, r'class="richie-react richie-react--course-run-enrollment"'
        )

    @override_settings(RICHIE_LMS_BACKENDS=[])
    def test_templates_course_detail_runs_future_open(self):
        """
        Priority 1: an upcoming open course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_future_open(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, "No open course runs")
        self.assertContains(
            response,
            (
                f'<a href="{course_run.resource_link:s}" '
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
        RICHIE_LMS_BACKENDS=[
            {
                "BACKEND": "richie.apps.courses.lms.edx.EdXLMSBackend",
                "JS_BACKEND": "openedx-hawthorn",
                "COURSE_REGEX": r".*",
                "JS_COURSE_REGEX": r"^.*/courses/(?<course_id>.*)/course/?$",
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
        course = CourseFactory()
        course_run = self.create_run_future_open(
            course,
            resource_link="http://edx:8073/courses/course-v1:edX+DemoX+Demo/course/",
        )
        self.assertTrue(course.extended_object.publish("en"))
        course_run.refresh_from_db()

        response = self.client.get(course.extended_object.get_absolute_url())

        # pylint: disable=consider-using-f-string
        pattern = r".*data-props=\"{{.*{}.*{}.*{}.*{}.*{}.*{}.*{}.*}}\"".format(
            "courseRun",
            "id",
            course_run.public_course_run.id,
            "resource_link",
            re.escape(course_run.public_course_run.resource_link),
            "priority",
            course_run.public_course_run.state["priority"],
        )

        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertContains(
            response, r'class="richie-react richie-react--course-run-enrollment"'
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_archived_open(self):
        """
        Priority 2: an archived open course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_archived_open(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, "No open course runs")
        self.assertContains(
            response,
            (
                f'<a href="{course_run.resource_link:s}" '
                'class="course-run-enrollment__cta">Study now</a>'
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

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_future_not_yet_open(self):
        """
        Priority 3: a future not yet open course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_future_not_yet_open(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Upcoming</h3>', html=True
        )

        start_string = dateformat.format(course_run.start, "N j, Y")
        end_string = dateformat.format(course_run.end, "N j, Y")
        self.assertContains(
            response,
            '<ul class="course-detail__run-list"><li>'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_future_closed(self):
        """
        Priority 4: a future and closed course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_future_closed(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Ongoing</h3>', html=True
        )

        start_string = dateformat.format(course_run.start, "N j, Y")
        end_string = dateformat.format(course_run.end, "N j, Y")
        self.assertContains(
            response,
            '<ul class="course-detail__run-list"><li>'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_ongoing_closed(self):
        """
        Priority 5: an ongoing and closed course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_ongoing_closed(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Ongoing</h3>', html=True
        )

        start_string = dateformat.format(course_run.start, "N j, Y")
        end_string = dateformat.format(course_run.end, "N j, Y")
        self.assertContains(
            response,
            '<ul class="course-detail__run-list"><li>'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_archived_closed(self):
        """
        Priority 6: an archived closed course run should show in a separate section.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_archived_closed(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No open course runs")
        self.assertContains(
            response, '<h3 class="course-detail__title">Archived</h3>', html=True
        )

        start_string = dateformat.format(course_run.start, "N j, Y")
        end_string = dateformat.format(course_run.end, "N j, Y")
        self.assertContains(
            response,
            '<ul class="course-detail__run-list"><li>'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )

    def test_templates_course_detail_runs_to_be_scheduled(self):
        """
        Priority 7: a course run with no date is only visible to staff users.
        """
        course = CourseFactory(page_title="my course")
        CourseRunFactory(direct_course=course, title="my course run", start=None)
        self.assertTrue(course.extended_object.publish("en"))

        # Anonymous users should not see the course run
        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, "My course run")

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
            '<ul class="course-detail__run-list"><li>My course run, from ... to ...</li></ul>',
            html=True,
        )

    def test_templates_course_detail_course_run_title_empty(self):
        """
        A course run title can be empty and in this case the "From ..." string should be
        capitalized.
        """
        course = CourseFactory()
        page = course.extended_object
        CourseRunFactory(
            direct_course=course,
            title=None,
            start=pytz.utc.localize(datetime(2020, 12, 12)),
            end=pytz.utc.localize(datetime(2020, 12, 15)),
        )
        self.assertTrue(page.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        # The description line should start with a capital letter
        self.assertContains(
            response, "<li>From Dec. 12, 2020 to Dec. 15, 2020</li>", html=True
        )

    def test_template_course_detail_without_course(self):
        """
        A course template page without attached course should show an error banner
        explaining to the user that he/she is misusing the template.
        """
        page = PageFactory(
            template="courses/cms/course_detail.html",
            title__language="en",
            should_publish=True,
        )

        with self.assertTemplateUsed(
            "courses/cms/fragment_error_detail_template_banner.html"
        ):
            response = self.client.get(page.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            (
                '<div class="banner banner--error banner--rounded" role="alert">'
                '<svg class="banner__icon"><use href="#icon-cross" /></svg>'
                '<p class="banner__message">'
                "A course object is missing on this course page. "
                "Please select another page template."
                "<br />"
                "If what you need is a course page, you need to create it "
                'via the wizard and choose "New course page".'
                "</p>"
                "</div>"
            ),
            html=True,
        )
