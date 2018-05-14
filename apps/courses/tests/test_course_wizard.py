"""
Test suite for the wizard creating a new Course page
"""
from django.core.urlresolvers import reverse

from cms.api import create_page
from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from apps.core.factories import UserFactory

from ..cms_wizards import CourseWizardForm
from ..factories import CourseFactory
from ..models import Course, CoursePage, COURSES_PAGE_REVERSE_ID


class CourseCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new course pages from the CMS"""

    def test_course_create_wizards_list(self):
        """
        The wizard to create a new Course page should be present on the wizards list page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = reverse("cms_wizard_create")
        response = self.client.get(url)

        # Check that our wizard to create courses is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new course page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New course page</strong>", html=True)

    def test_course_wizard_submit_form(self):
        """
        Submitting a valid CourseWizardForm should create a course and its
        related page.
        """
        # A parent page should pre-exist
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=COURSES_PAGE_REVERSE_ID
        )

        # We can submit a form with just the title set
        form = CourseWizardForm(
            data={"title": "My title", "active_session": "course_key"}
        )
        self.assertTrue(form.is_valid())
        page = form.save()

        # The course and its related page should have been created as draft
        self.assertEqual(Page.objects.count(), 2)
        self.assertEqual(Page.objects.drafts().count(), 2)
        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")
        # Course exists
        self.assertTrue(Course.objects.filter(active_session="course_key").exists())
        # CoursePage object exists
        self.assertTrue(
            CoursePage.objects.filter(course__active_session="course_key").exists()
        )

    def test_course_wizard_submit_form_max_lengths(self):
        """
        Check form correctly catch error when allowed slug size would causes db error, because
        page `path` contains current slug and all previous pages slugs and is limited to 255 chars.
        """
        # A parent page with a very long slug
        create_page(
            "Courses " + "y" * 200,
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSES_PAGE_REVERSE_ID,
        )

        # A coursePage with a correct slug, but too long regarding parent's one
        data = {"title": "t" * 255, "slug": "s" * 100, "active_session": "course_key"}
        form = CourseWizardForm(data=data)
        self.assertFalse(form.is_valid())
        # Error message contains variable values, so we only check the beginning
        self.assertIn("Slug size is too long", form.errors["slug"][0])

    def test_course_wizard_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A parent page should pre-exist
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=COURSES_PAGE_REVERSE_ID
        )

        # Submit a title at max length
        data = {"title": "t" * 255, "active_session": "course_key"}
        form = CourseWizardForm(data=data)
        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_course_wizard_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=COURSES_PAGE_REVERSE_ID
        )
        # Submit a title that is too long and a slug that is ok
        invalid_data = {
            "title": "t" * 256, "slug": "s" * 200, "active_session": "course_key"
        }

        form = CourseWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_course_wizard_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=COURSES_PAGE_REVERSE_ID
        )
        # Submit a slug that is too long and a title that is ok
        invalid_data = {
            "title": "t" * 255, "slug": "s" * 201, "active_key": "course_key"
        }

        form = CourseWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_course_wizard_parent_page_should_exist(self):
        """
        We should not be able to create a CMS Course Page if the
        parent page does not exist
        """
        CourseFactory()
        form = CourseWizardForm(
            data={
                "title": "My title", "slug": "my-title", "active_session": "course_key"
            }
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a `search` page and set its `reverse_id` to "
                    "`{courses_reverse}`.".format(
                        courses_reverse=COURSES_PAGE_REVERSE_ID
                    )
                ]
            },
        )

    def test_course_wizard_submit_form_active_session_too_long(self):
        """
        Trying to set a active_session that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=COURSES_PAGE_REVERSE_ID
        )
        # Submit a slug that is too long and a title that is ok
        invalid_data = {
            "title": "t" * 255, "slug": "s" * 50, "active_session": "k" * 201
        }

        form = CourseWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["active_session"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_course_wizard_submit_form_no_active_session(self):
        """
        We should be able to create several Course with `active_session` left blank
        """
        # A parent page should pre-exist
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=COURSES_PAGE_REVERSE_ID
        )
        data = {"title": "Title1", "active_key": ""}
        form = CourseWizardForm(data=data)
        self.assertTrue(form.is_valid())
        form.save()

        data = {"title": "Title2", "active_key": ""}
        form = CourseWizardForm(data=data)
        self.assertTrue(form.is_valid())
        form.save()

        # We should have 2 courses with no `active_session`
        self.assertEqual(Course.objects.filter(active_session__isnull=True).count(), 2)

    def test_course_wizard_already_existing_course_key(self):
        """
        We should not be able to create a course page for a course which already has one.
        """
        # A parent page should pre-exist
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=COURSES_PAGE_REVERSE_ID
        )
        # Create course page
        data = {"title": "My title", "slug": "my-slug", "active_session": "course_key"}
        form = CourseWizardForm(data=data)
        self.assertTrue(form.is_valid())
        form.save()
        # Repost same data
        form = CourseWizardForm(data=data)
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["active_session"],
            ["A course page for a course with this key already exists"],
        )
