"""
Test suite for the wizard creating a new Course page
"""
from django.urls import reverse
from django.utils import translation

from cms.api import create_page
from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_wizards import CourseRunWizardForm
from richie.apps.courses.factories import CourseFactory
from richie.apps.courses.models import Course, CourseRun


class CourseRunCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new course run pages from the CMS"""

    def test_cms_wizards_course_run_create_wizards_list_superuser_course(self):
        """
        The wizard to create a new course run page should be present on the wizards list page
        for a superuser visiting a course page.
        """
        course = CourseFactory()
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(
            reverse("cms_wizard_create"), course.extended_object.id
        )
        response = self.client.get(url)

        # Check that our wizard to create course runs is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new course run page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New course run page</strong>", html=True)

    def test_cms_wizards_course_run_create_wizards_list_superuser_snapshot(self):
        """
        The wizard to create a new course run page should not be present on the wizards list
        page for a superuser visiting a course snapshot page.
        """
        snapshot = CourseFactory()
        CourseFactory(page_parent=snapshot.extended_object)
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(
            reverse("cms_wizard_create"), snapshot.extended_object.id
        )
        response = self.client.get(url)

        # Check that our wizard to create course runs is not on this page
        self.assertNotContains(response, "new course run", status_code=200, html=True)

    def test_cms_wizards_course_run_create_wizards_list_superuser_not_a_course(self):
        """
        The wizard to create a new course run page should not be present on the wizards list
        page for a superuser visiting a page that is not a course.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(reverse("cms_wizard_create"), page.id)
        response = self.client.get(url)

        # Check that our wizard to create course runs is not on this page
        self.assertNotContains(response, "new course run", status_code=200, html=True)

    def test_cms_wizards_course_run_create_wizards_list_staff(self):
        """
        The wizard to create a new course run page should not be present on the wizards list
        page for a simple staff user.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(reverse("cms_wizard_create"), page.id)
        response = self.client.get(url)

        # Check that our wizard to create course runs is not on this page
        self.assertNotContains(response, "new course run", status_code=200, html=True)

    def test_cms_wizards_course_run_submit_form_not_a_course(self):
        """
        Submitting a valid CourseRunWizardForm on a page that is not a course should raise
        a validation error.
        """
        page = create_page("page", "richie/single_column.html", "en")

        # Submit a valid form
        form = CourseRunWizardForm(data={"title": "My title"})
        form.page = page
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"__all__": ["Course runs can only be created from a course page."]},
        )

    def test_cms_wizards_course_run_submit_form_success(self):
        """
        Submitting a valid CourseRunWizardForm should create a course run and its
        related page.
        """
        course = CourseFactory()

        # Submit a valid form
        form = CourseRunWizardForm(data={"title": "My title"})
        form.page = course.extended_object
        self.assertTrue(form.is_valid())
        page = form.save()
        course_run = page.courserun

        # The course run and its related page should have been created as draft
        Page.objects.drafts().get(id=page.id)
        CourseRun.objects.get(id=course_run.id, extended_object=page)

        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")

        # The course run should be a child of the course page
        self.assertEqual(course_run.extended_object.parent_page, course.extended_object)

        # The languages field should have been set
        self.assertEqual(course_run.languages, ["en"])

    def test_cms_wizards_course_run_submit_form_max_lengths(self):
        """
        Check that the form correctly raises an error when the slug is too long. The path built
        by combining the slug of the page with the slug of its parent page, should not exceed
        255 characters in length.
        """
        # A parent page with a very long slug
        root_page = create_page(
            "p" * 100,
            "richie/single_column.html",
            "en",
            reverse_id=Course.ROOT_REVERSE_ID,
        )
        course = CourseFactory(page_title="c" * 100, page_parent=root_page)

        # A course run with a slug at the limit length should work
        form = CourseRunWizardForm(data={"title": "t" * 53})
        form.page = course.extended_object
        self.assertTrue(form.is_valid())
        form.save()

        # A course run with a slug too long with regards to the parent's one should raise an error
        form = CourseRunWizardForm(data={"title": "t" * 54})
        form.page = course.extended_object
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            (
                "This slug is too long. The length of the path built by prepending the slug of "
                "the parent page would be 256 characters long and it should be less than 255"
            ),
        )

    def test_cms_wizards_course_run_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A course should pre-exist
        course = CourseFactory()

        # Submit a title at max length
        data = {"title": "t" * 255}
        form = CourseRunWizardForm(data=data)
        form.page = course.extended_object
        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_cms_wizards_course_run_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A course should pre-exist
        course = CourseFactory()

        # Submit a title that is too long
        invalid_data = {"title": "t" * 256}

        form = CourseRunWizardForm(data=invalid_data)
        form.page = course.extended_object
        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_cms_wizards_course_run_language_active(self):
        """
        The language should be set to the active language.
        """
        course = CourseFactory()

        # Submit a valid form
        form = CourseRunWizardForm(data={"title": "My title"})
        form.page = course.extended_object
        self.assertTrue(form.is_valid())
        with translation.override("fr"):
            page = form.save()

        # The language field should have been set to the active language
        self.assertEqual(page.courserun.languages, ["fr"])
