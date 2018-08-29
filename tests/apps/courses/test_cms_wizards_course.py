"""
Test suite for the wizard creating a new Course page
"""
from django.core.urlresolvers import reverse

from cms.api import create_page
from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_wizards import CourseWizardForm
from richie.apps.courses.factories import OrganizationFactory
from richie.apps.courses.models import Course


class CourseCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new course pages from the CMS"""

    def test_cms_wizards_course_create_wizards_list(self):
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

    def test_cms_wizards_course_submit_form(self):
        """
        Submitting a valid CourseWizardForm should create a course and its
        related page.
        """
        # An organization and a parent page should pre-exist
        organization = OrganizationFactory()
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=Course.ROOT_REVERSE_ID
        )

        # We can submit a form omitting the slug
        form = CourseWizardForm(
            data={"title": "My title", "organization": organization.id}
        )
        self.assertTrue(form.is_valid())
        page = form.save()
        course = page.course

        # The course and its related page should have been created as draft
        Page.objects.drafts().get(id=page.id)
        Course.objects.get(id=course.id, extended_object=page)

        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")

        # The "organization_main" field should be set
        self.assertEqual(course.organization_main, organization)

    def test_cms_wizards_course_submit_form_max_lengths(self):
        """
        Check that the form correctly raises an error when the slug is too long. The path built
        by combining the slug of the page with the slug of its parent page, should not exceed
        255 characters in length.
        """
        # A parent page with a very long slug
        create_page(
            "y" * 200, "richie/fullwidth.html", "en", reverse_id=Course.ROOT_REVERSE_ID
        )

        # A course with a slug at the limit length should work
        organization = OrganizationFactory()
        form = CourseWizardForm(
            data={"title": "t" * 255, "slug": "s" * 54, "organization": organization.id}
        )
        self.assertTrue(form.is_valid())
        form.save()

        # A course with a slug too long with regards to the parent's one should raise an error
        form = CourseWizardForm(
            data={"title": "t" * 255, "slug": "s" * 55, "organization": organization.id}
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            (
                "This slug is too long. The length of the path built by prepending the slug of "
                "the parent page would be 256 characters long and it should be less than 255"
            ),
        )

    def test_cms_wizards_course_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # An organization and a parent page should pre-exist
        organization = OrganizationFactory()
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=Course.ROOT_REVERSE_ID
        )

        # Submit a title at max length
        data = {"title": "t" * 255, "organization": organization.id}
        form = CourseWizardForm(data=data)
        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_cms_wizards_course_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # An organization and a parent page should pre-exist
        organization = OrganizationFactory()
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=Course.ROOT_REVERSE_ID
        )
        # Submit a title that is too long and a slug that is ok
        invalid_data = {
            "title": "t" * 256,
            "slug": "s" * 200,
            "organization": organization.id,
        }

        form = CourseWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_cms_wizards_course_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # An organization and a parent page should pre-exist
        organization = OrganizationFactory()
        create_page(
            "Courses", "richie/fullwidth.html", "en", reverse_id=Course.ROOT_REVERSE_ID
        )
        # Submit a slug that is too long and a title that is ok
        invalid_data = {
            "title": "t" * 255,
            "slug": "s" * 201,
            "organization": organization.id,
        }

        form = CourseWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_cms_wizards_course_parent_page_should_exist(self):
        """
        We should not be able to create a course page if the parent page does not exist
        """
        organization = OrganizationFactory()
        form = CourseWizardForm(
            data={"title": "My title", "organization": organization.id}
        )

        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a parent page and set its `reverse_id` to `courses`."
                ]
            },
        )
