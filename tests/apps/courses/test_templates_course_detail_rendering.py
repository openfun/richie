"""
End-to-end tests for the course detail view
"""
import random
import re
from datetime import datetime, timedelta

from django.test.utils import override_settings
from django.utils import dateformat, timezone

import lxml.html
import pytz
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.courses.cms_plugins import LicencePlugin
from richie.apps.courses.factories import (
    VIDEO_SAMPLE_LINKS,
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    LicenceFactory,
    OrganizationFactory,
    ProgramFactory,
)
from richie.apps.courses.models import CourseRun, CourseRunCatalogVisibility
from richie.apps.demo.utils import pick_image

# pylint: disable=too-many-lines, too-many-public-methods


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
            enrollment_count=11000,
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
            response,
            "<title>Very interesting course - Course - example.com</title>",
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
                    '<span class="offscreen">Category</span>'
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
            r'<img src="/media/filer_public_thumbnails/filer_public/.*icon\.jpg.*alt="">'
            r'<span class="offscreen">Category</span>'
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
                '<h2 class="organization-glimpse__title" property="name">{title:s}</h2>'.format(
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

        # Check that enrollment count is not present
        self.assertContains(response, "enrollment-count")
        self.assertContains(response, "11,000 already enrolled!")

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
            response,
            "<title>Very interesting course - Course - example.com</title>",
            html=True,
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
                '<h2 class="organization-glimpse__title" property="name">{title:s}</h2>'.format(
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
                    '<span class="offscreen">Category</span>'
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
                '<span class="offscreen">Category</span>'
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
        url = organizations[0].extended_object.get_absolute_url()
        title = organizations[0].extended_object.get_title()
        label = f'Main organization "{title}"'

        response = self.client.get(course.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)

        html = lxml.html.fromstring(response.content)

        link = html.cssselect(".subheader__cartouche")[0]
        self.assertEqual(link.get("title"), label)
        self.assertEqual(link.get("aria-label"), label)
        self.assertEqual(link.get("href"), url)
        self.assertEqual(link.get("property"), "provider")
        self.assertEqual(link.get("typeof"), "CollegeOrUniversity")

        meta_name = link.cssselect('meta[property="name"]')[0]
        self.assertEqual(meta_name.get("content"), title)
        meta_url = link.cssselect('meta[property="url"]')[0]
        self.assertEqual(meta_url.get("content"), f"http://example.com{url:s}")

        img = link.cssselect("img")[0]
        self.assertEqual(img.get("alt"), "")
        self.assertEqual(img.get("property"), "logo")
        self.assertEqual(img.get("sizes"), "30vw")
        self.assertIsNotNone(
            re.search(
                r"/media/filer_public_thumbnails/filer_public/[^>]+logo\.jpg__200x113[^>]+",
                img.get("src"),
            )
        )

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
            rf'<iframe src="{video_sample.url:s}"  allowfullscreen></iframe>'
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
            rf'<div class="subheader__teaser"><img.*/{video_sample.image:s}.*/></div>'
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
            rf'<iframe src="{video_sample.url:s}"  allowfullscreen></iframe>'
            r"</div>"
            r"</div>"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))


# pylint: disable=too-many-public-methods
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

    def create_run_future_not_yet_open(self, course, **kwargs):
        """
        Not a test. Create a course run in the future and not yet open for enrollment.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now + timedelta(hours=2),
            enrollment_start=self.now + timedelta(hours=1),
            **kwargs,
        )

    def create_run_future_closed(self, course, **kwargs):
        """
        Not a test. Create a course run in the future and already closed for enrollment.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
            **kwargs,
        )

    def create_run_ongoing_closed(self, course, **kwargs):
        """
        Not a test. Create an on-going course run that is closed for enrollment.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
            enrollment_end=self.now,
            **kwargs,
        )

    def create_run_archived_open(self, course, **kwargs):
        """
        Not a test. Create an archived open course run.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now + timedelta(hours=1),
            **kwargs,
        )

    def create_run_archived_closed(self, course, **kwargs):
        """
        Not a test. Create an archived closed course run.
        """
        return CourseRunFactory(
            direct_course=course,
            title="my course run",
            start=self.now - timedelta(hours=1),
            end=self.now,
            enrollment_end=self.now - timedelta(hours=1),
            **kwargs,
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
        self.assertEqual(
            re.findall('course-detail__runs--[^"]+', str(response.content)),
            ["course-detail__runs--open"],
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
        self.assertEqual(
            re.findall('course-detail__runs--[^"]+', str(response.content)),
            ["course-detail__runs--open"],
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
        Priority 2: an archived open course run should show in the open section.
        """
        course = CourseFactory(page_title="my course")
        course_run = self.create_run_archived_open(course)
        self.assertTrue(course.extended_object.publish("en"))

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            (
                f'<a href="{course_run.resource_link:s}" '
                'class="course-run-enrollment__cta">Study now</a>'
            ),
            html=True,
        )
        self.assertEqual(
            re.findall('course-detail__runs--[^"]+', str(response.content)),
            ["course-detail__runs--open"],
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
            '<ul class="course-detail__run-list">'
            '<li class="course-detail__run-list--course_and_search">'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )
        self.assertEqual(
            re.findall('course-detail__runs--[^"]+', str(response.content)),
            ["course-detail__runs--open", "course-detail__runs--upcoming"],
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
            '<ul class="course-detail__run-list">'
            '<li class="course-detail__run-list--course_and_search">'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )
        self.assertEqual(
            re.findall('course-detail__runs--[^"]+', str(response.content)),
            ["course-detail__runs--open", "course-detail__runs--ongoing"],
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
            '<ul class="course-detail__run-list">'
            '<li class="course-detail__run-list--course_and_search">'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )
        self.assertEqual(
            re.findall('course-detail__runs--[^"]+', str(response.content)),
            ["course-detail__runs--open", "course-detail__runs--ongoing"],
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
            '<ul class="course-detail__run-list">'
            '<li class="course-detail__run-list--course_and_search">'
            f"My course run, from {start_string:s} to {end_string:s}</li></ul>",
            html=True,
        )
        self.assertEqual(
            re.findall('course-detail__runs--[^"]+', str(response.content)),
            ["course-detail__runs--open", "course-detail__runs--archived"],
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
            '<ul class="course-detail__run-list">'
            '<li class="course-detail__run-list--course_and_search">'
            "My course run, from ... to ...</li></ul>",
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
            response,
            '<li class="course-detail__run-list--course_and_search">'
            "From Dec. 12, 2020 to Dec. 15, 2020</li>",
            html=True,
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
                '<svg class="banner__icon" aria-hidden="true"><use href="#icon-cross" /></svg>'
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

    @override_settings(RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT=3)
    def test_templates_course_detail_runs_with_only_one_enrollment_count(self):
        """
        When a run has any enrollment count number, it should display the sum for all runs
        """
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(
            course,
            enrollment_count=3,
        )
        course_run = self.create_run_archived_open(
            course,
            enrollment_count=0,
        )
        self.assertTrue(course.extended_object.publish("en"))
        course_run.refresh_from_db()

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertContains(response, r"3 already enrolled")

    @override_settings(RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT=3)
    def test_templates_course_detail_runs_with_multiple_enrollment_counts(self):
        """
        When a run has any enrollment count number, it should display the sum for all runs
        """
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(
            course,
            enrollment_count=3,
        )
        course_run = self.create_run_archived_open(
            course,
            enrollment_count=1,
        )
        course_run = self.create_run_archived_closed(
            course,
            enrollment_count=0,
        )
        self.assertTrue(course.extended_object.publish("en"))
        course_run.refresh_from_db()

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertContains(response, r"4 already enrolled")

    @override_settings(RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT=6)
    def test_templates_course_detail_minimum_enrollment_count(self):
        """
        Show only the enrollment count when it is greather that the minimum setting value
        """
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(
            course,
            enrollment_count=5,
        )
        self.assertTrue(course.extended_object.publish("en"))
        course_run.refresh_from_db()

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertNotContains(response, r"already enrolled")

    @override_settings(RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT=0)
    def test_templates_course_detail_runs_count_minimum_0(self):
        """
        When the minimum number of enrollments is set to 0, the count should be hidden
        """
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(
            course,
            enrollment_count=3,
        )
        self.assertTrue(course.extended_object.publish("en"))
        course_run.refresh_from_db()

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertNotContains(response, "enrollment-count")
        self.assertNotContains(response, "already enrolled")

    @override_settings(RICHIE_MINIMUM_COURSE_RUNS_ENROLLMENT_COUNT=None)
    def test_templates_course_detail_runs_count_minimum_none(self):
        """
        When the minimum number of enrollments is set to None, the count should be hidden
        """
        course = CourseFactory()
        course_run = self.create_run_ongoing_open(
            course,
            enrollment_count=3,
        )
        self.assertTrue(course.extended_object.publish("en"))
        course_run.refresh_from_db()

        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertNotContains(response, "enrollment-count")
        self.assertNotContains(response, "already enrolled")

    def test_templates_course_detail_license_missing(self):
        """
        A course page without a license should not include license block on its published page.
        """
        course = CourseFactory()
        self.assertTrue(course.extended_object.publish("en"))
        response = self.client.get(course.extended_object.get_absolute_url())
        self.assertNotContains(response, "license")

    def test_templates_course_detail_license_missing_edit_mode(self):
        """
        A course page without a license should include the inputs of the license blocks on edit
        mode.
        """
        # Login with an user with all permissions
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the edit mode of a course page
        course = CourseFactory()
        page_url = course.extended_object.get_absolute_url(language="en")
        self.assertTrue(course.extended_object.publish("en"))
        url = f"{page_url:s}?edit"
        response = self.client.get(url)

        self.assertContains(response, "What is the license for the course content?")
        self.assertContains(
            response,
            "What is the license for the content created by course participants?",
        )

    def test_templates_course_detail_license_only_content(self):
        """
        A course with a license on course content and without on course partipants should only
        show the 1st.
        """
        course = CourseFactory()

        # Create random values for parameters with a factory
        licence = LicenceFactory(name="Some license")

        page = course.extended_object
        placeholder = page.placeholders.get(slot="course_license_content")
        add_plugin(placeholder, LicencePlugin, "en", licence=licence)

        self.assertTrue(page.publish("en"))
        response = self.client.get(page.get_absolute_url())

        self.assertContains(response, "License for the course content")
        self.assertContains(response, "Some license")

        # Without course license participation
        self.assertNotContains(
            response, "License for the content created by course participants"
        )

    def test_templates_course_detail_license_only_participation(self):
        """
        A course with a license on course participation and without on course conent should only
        show the 1st.
        """
        course = CourseFactory()

        # Create random values for parameters with a factory
        licence = LicenceFactory(name="Some license")

        page = course.extended_object
        placeholder = page.placeholders.get(slot="course_license_participation")
        add_plugin(placeholder, LicencePlugin, "en", licence=licence)

        self.assertTrue(course.extended_object.publish("en"))
        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertContains(
            response, "License for the content created by course participants"
        )
        self.assertContains(response, "Some license")

        # Without course license participation
        self.assertNotContains(response, "License for the course content")

    @override_settings(RICHIE_MAX_ARCHIVED_COURSE_RUNS=3)
    def test_templates_course_detail_view_richie_max_archived_course_runs(self):
        """
        Only the number of archived course runs defined by `RICHIE_MAX_ARCHIVED_COURSE_RUNS`
        setting should be displayed.
        """
        course = CourseFactory()
        for _ in range(5):
            self.create_run_archived_closed(course).refresh_from_db()
        course.extended_object.publish("en")
        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertContains(
            response,
            '<li class="is-hidden',
            count=2,
        )
        self.assertContains(response, "course-detail__view-more-runs")

    @override_settings(RICHIE_MAX_ARCHIVED_COURSE_RUNS=None)
    def test_templates_course_detail_view_no_richie_max_archived_course_runs(self):
        """
        All course runs should be displayed when `RICHIE_MAX_ARCHIVED_COURSE_RUNS` setting is None
        """
        course = CourseFactory()
        for _ in range(5):
            self.create_run_archived_closed(course).refresh_from_db()
        course.extended_object.publish("en")
        response = self.client.get(course.extended_object.get_absolute_url())

        self.assertNotContains(
            response,
            '<li class="is-hidden',
        )
        self.assertNotContains(response, "course-detail__view-more-runs")

    def test_templates_course_detail_meta_description(self):
        """
        The course meta description should show meta_description placeholder if defined
        """
        course = CourseFactory()
        page = course.extended_object

        title_obj = page.get_title_obj(language="en")
        title_obj.meta_description = "A custom description of the course"
        title_obj.save()

        page.publish("en")

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A custom description of the course" />',
        )

    def test_templates_course_detail_meta_description_course_introduction(self):
        """
        The course meta description should show the course_introduction if no meta_description is
        specified
        """
        course = CourseFactory()
        page = course.extended_object

        # Add an course_introduction to the course
        placeholder = course.extended_object.placeholders.get(
            slot="course_introduction"
        )
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A further course introduction of the course",
        )
        page.publish("en")

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A further course introduction of the course" />',
        )

    def test_templates_course_detail_meta_description_course_introduction_max_length(
        self,
    ):
        """
        The course meta description should be cut if it exceeds more than 160 caracters
        """
        course = CourseFactory()
        page = course.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
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

        cut = placeholder_value[0:160]
        self.assertContains(
            response,
            f'<meta name="description" content="{cut}" />',
        )

    def test_templates_course_detail_meta_description_empty(self):
        """
        The course meta description should not be present if neither the meta_description field
        on the page, nor the `course_introduction` placeholder are filled
        """
        course = CourseFactory()
        page = course.extended_object
        page.publish("en")

        url = course.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            '<meta name="description"',
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_runs_catalog_visibility(self):
        """
        Check each course run catalog visibility.

        View mode:
        * `course_and_search` => visible
        * `course_only`       => visible
        * `hidden`            => not visible

        Edit mode:
        * `course_and_search`   => visible
        * `course_only`  => visible
        * `hidden` => visible
        """
        course = CourseFactory(page_title="my course")
        page = course.extended_object
        course_run_title_upcoming_hidden = "A hidden course run"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_upcoming_hidden,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            start=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now + timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
        )
        course_run_title_open_about = "A visible course run only on course page"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_open_about,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_ONLY,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
        )
        course_run_title_open_both = "A visible course run"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_open_both,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_AND_SEARCH,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
        )
        self.assertTrue(page.publish("en"))

        # view mode
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(
            response,
            course_run_title_upcoming_hidden,
            msg_prefix=("A hidden upcoming run should not be visible on view mode"),
        )
        self.assertNotContains(
            response,
            "Upcoming",
            msg_prefix=(
                "The hidden upcoming run should not be visible so the upcoming title should not be"
                "visible"
            ),
        )
        self.assertContains(
            response,
            course_run_title_open_about,
            msg_prefix=(
                "An open run with `about` on catalog visibility should be visible on view mode"
            ),
        )
        self.assertContains(
            response,
            course_run_title_open_both,
            msg_prefix=(
                "An open run with `both` on catalog visibility should be visible "
                "on view mode of the course page"
            ),
        )

        # edit mode, create user, login with him and open course page on edit mode
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")
        url = f"{url:s}?edit"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            course_run_title_open_about,
            msg_prefix=(
                "An open run with `about`on the catalog visibility should be visible "
                "on edit mode of the course page"
            ),
        )
        self.assertContains(
            response,
            course_run_title_open_both,
            msg_prefix=(
                "An open run with `both`on the catalog visibility should be visible "
                "on edit mode of the course page"
            ),
        )
        self.assertContains(
            response,
            course_run_title_upcoming_hidden,
            msg_prefix=(
                "A hidden upcoming run should be visible "
                "on edit mode of the course page"
            ),
        )
        self.assertContains(
            response,
            "Upcoming",
            msg_prefix=(
                "The hidden upcoming run is visible on edit mode "
                "so the Upcoming title should be visible"
            ),
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_hidden_courses(self):
        """
        Check that each run on different state (Open, to be scheduled, hidden, ongoing, archived)
        is not visible on view mode, also check that each title group is not visible.
        On edit mode they should all be visible.
        """
        course = CourseFactory(page_title="my course")
        page = course.extended_object
        course_run_title_open_hidden = "An open hidden course run"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_open_hidden,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
        )
        course_run_title_to_be_scheduled_hidden = "A to be scheduled hidden course run"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_to_be_scheduled_hidden,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            start=None,
            end=None,
        )
        course_run_title_upcoming_hidden = "A hidden upcoming course run"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_upcoming_hidden,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            start=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now + timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
        )
        course_run_title_ongoing_hidden = "An ongoing hidden course run"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_ongoing_hidden,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now - timedelta(hours=1),
        )
        course_run_title_archived_hidden = "An archived hidden course run"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_archived_hidden,
            catalog_visibility=CourseRunCatalogVisibility.HIDDEN,
            start=self.now - timedelta(hours=2),
            end=self.now - timedelta(hours=1),
            enrollment_start=self.now - timedelta(hours=3),
            enrollment_end=self.now - timedelta(hours=2),
        )
        self.assertTrue(page.publish("en"))

        # View mode
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(response, course_run_title_open_hidden)
        self.assertNotContains(response, "Enroll now")
        self.assertContains(response, "No open course runs")

        self.assertNotContains(response, course_run_title_to_be_scheduled_hidden)
        self.assertNotContains(response, "To be scheduled")

        self.assertNotContains(response, course_run_title_upcoming_hidden)
        self.assertNotContains(response, "Upcoming")

        self.assertNotContains(response, course_run_title_ongoing_hidden)
        self.assertNotContains(response, "Ongoing")

        self.assertNotContains(response, course_run_title_archived_hidden)
        self.assertNotContains(response, "Archived")

        # edit mode, create user, login with him and open course page on edit mode
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")
        url = f"{url:s}?edit"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, course_run_title_open_hidden)
        self.assertContains(response, "Enroll now")

        self.assertContains(response, course_run_title_to_be_scheduled_hidden)
        self.assertContains(response, "To be scheduled")

        self.assertContains(response, course_run_title_upcoming_hidden)
        self.assertContains(response, "Upcoming")

        self.assertContains(response, course_run_title_ongoing_hidden)
        self.assertContains(response, "Ongoing")

        self.assertContains(response, course_run_title_archived_hidden)
        self.assertContains(response, "Archived")

    @timezone.override(pytz.utc)
    def test_templates_course_detail_open_runs_presentation_ordering(
        self,
    ):
        """
        Verify the order of 4 open for enrollment course runs.
        Firstly runs that contains the language of the current user and only after the runs that
        don't match the current user authenticated language. On both groups, they should be sorted
        by course start date.
        """
        course = CourseFactory(page_title="my course")
        page = course.extended_object
        course_run_title_fr_minus_2h = "French course run that have started -2h"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_fr_minus_2h,
            languages=["fr"],
            start=self.now - timedelta(hours=2),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=2),
            enrollment_end=self.now + timedelta(hours=1),
        )
        course_run_title_fr_en_plus_1h = (
            "Course run in both English and French that starts +1h"
        )
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_fr_en_plus_1h,
            languages=["en", "fr"],
            start=self.now + timedelta(hours=1),
            end=self.now + timedelta(hours=3),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
        )
        course_run_title_en_minus_1h = "A course run in English that started -1h"
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_en_minus_1h,
            languages=["en"],
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
        )
        course_run_title_fr_plus_2h = (
            "French course run that have will start on the next 2h"
        )
        CourseRunFactory(
            direct_course=course,
            title=course_run_title_fr_plus_2h,
            languages=["fr"],
            start=self.now + timedelta(hours=2),
            end=self.now + timedelta(hours=3),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=1),
        )
        # viewing the page as en language
        self.assertTrue(page.publish("en"))

        # view mode
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        response_content = response.content.decode("UTF-8")

        # get each course title index position
        fr_minus_2h = response_content.index(course_run_title_fr_minus_2h)
        fr_en_plus_1h_pos = response_content.index(course_run_title_fr_en_plus_1h)
        en_minus_1h_pos = response_content.index(course_run_title_en_minus_1h)
        fr_plus_2h = response_content.index(course_run_title_fr_plus_2h)

        # Check the order of the open runs (language; start run):
        # 1. en    -1h
        # 2. fr,en +1h
        # 3. fr    -2h
        # 4. fr    +2h
        self.assertLess(en_minus_1h_pos, fr_en_plus_1h_pos)
        self.assertLess(fr_en_plus_1h_pos, fr_minus_2h)
        self.assertLess(fr_minus_2h, fr_plus_2h)

    @timezone.override(pytz.utc)
    def test_templates_course_detail_scroll_to_open_course_runs_multiple_runs(
        self,
    ):
        """
        Test if it is shown an anchor that scrolls to the multiple open course runs
        """
        course = CourseFactory(page_title="my course")
        page = course.extended_object
        for i in range(2):  # pylint: disable=unused-variable
            CourseRunFactory(
                direct_course=course,
                start=self.now - timedelta(hours=1),
                end=self.now + timedelta(hours=2),
                enrollment_start=self.now - timedelta(hours=1),
                enrollment_end=self.now + timedelta(hours=2),
            )

        self.assertTrue(page.publish("en"))

        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response, "2 course runs are currently open for this course"
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_scroll_to_open_course_runs_single_run(
        self,
    ):
        """
        Test if the anchor that scrolls the viewport to the open course runs is missing
        when there is a single open course run.
        """
        course = CourseFactory(page_title="my course")
        page = course.extended_object

        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
        )

        self.assertTrue(page.publish("en"))

        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response, "course runs are currently open for this course"
        )

    @timezone.override(pytz.utc)
    def test_templates_course_detail_scroll_to_open_course_runs_no_open_runs(
        self,
    ):
        """
        Test if the anchor that scrolls the viewport to the open course runs is missing
        when there is a single open course run.
        """
        course = CourseFactory(page_title="my course")
        page = course.extended_object

        self.assertTrue(page.publish("en"))

        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response, "course runs are currently open for this course"
        )

    def test_templates_course_detail_no_runs_msg(self):
        """
        Test if the `No course runs` message is displayed when the course doesn't have any run.
        """
        course = CourseFactory()
        page = course.extended_object

        self.assertTrue(page.publish("en"))
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No course runs")

    def test_templates_course_detail_no_other_runs_msg(self):
        """
        Test if the `No other course runs` message is displayed when there is a single open
        course run.
        """
        course = CourseFactory()
        page = course.extended_object
        CourseRunFactory(
            direct_course=course,
            start=self.now - timedelta(hours=1),
            end=self.now + timedelta(hours=2),
            enrollment_start=self.now - timedelta(hours=1),
            enrollment_end=self.now + timedelta(hours=2),
        )

        self.assertTrue(page.publish("en"))
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "No other course runs")

    @override_settings(JOANIE={"ENABLED": True, "BASE_URL": "https://joanie.test"})
    def test_template_course_detail_with_joanie_enabled(self):
        """
        When Joanie is enabled, course detail template should use
        fragment_course_products template to display the React widget in charge
        of retrieve and display products related to the course
        """
        course = CourseFactory(code="01337", should_publish=True)
        page = course.extended_object

        with self.assertTemplateUsed(
            "courses/cms/fragment_course_products.html",
        ):
            response = self.client.get(page.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response, r'class="richie-react richie-react--course-products-list"'
        )

        pattern = r".*data-props=.*code.*01337.*"

        self.assertIsNotNone(re.search(pattern, str(response.content)))
