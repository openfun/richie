"""
Test suite for the wizard creating a new Subject page
"""
from django.core.urlresolvers import reverse

from cms.api import create_page
from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from apps.core.factories import UserFactory

from ..cms_wizards import SubjectWizardForm
from ..models import Subject


class SubjectCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new subject pages from the CMS"""

    def test_subject_create_wizards_list(self):
        """
        The wizard to create a new subject page should be present on the wizards list page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = reverse("cms_wizard_create")
        response = self.client.get(url)

        # Check that our wizard to create courses is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new subject page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New subject page</strong>", html=True)

    def test_subject_wizard_submit_form(self):
        """
        Submitting a valid SubjectWizardForm should create a Subject page extension and its
        related page.
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=Subject.ROOT_REVERSE_ID,
        )
        # We can submit a form with just the title set
        form = SubjectWizardForm(data={"title": "My title"})
        self.assertTrue(form.is_valid())
        page = form.save()

        # Related page should have been created as draft
        Page.objects.drafts().get(id=page.id)
        Subject.objects.get(id=page.subject.id, extended_object=page)

        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")

    def test_subject_wizard_submit_form_max_lengths(self):
        """
        Check that the form correctly raises an error when the slug is too long. The path built
        by combining the slug of the page with the slug of its parent page, should not exceed
        255 characters in length.
        """
        # A parent page with a very long slug
        create_page(
            "y" * 200, "richie/fullwidth.html", "en", reverse_id=Subject.ROOT_REVERSE_ID
        )

        # A subject with a slug at the limit length should work
        form = SubjectWizardForm(data={"title": "t" * 255, "slug": "s" * 54})
        self.assertTrue(form.is_valid())
        form.save()

        # A subject with a slug too long with regards to the parent's one should raise an error
        form = SubjectWizardForm(data={"title": "t" * 255, "slug": "s" * 55})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            (
                "This slug is too long. The length of the path built by prepending the slug of "
                "the parent page would be 256 characters long and it should be less than 255"
            ),
        )

    def test_subject_wizard_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=Subject.ROOT_REVERSE_ID,
        )

        # Submit a title at max length
        data = {"title": "t" * 255}

        form = SubjectWizardForm(data=data)
        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_subject_wizard_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=Subject.ROOT_REVERSE_ID,
        )

        # Submit a title that is too long and a slug that is ok
        invalid_data = {"title": "t" * 256, "slug": "s" * 200}

        form = SubjectWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_subject_wizard_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Sujects", "richie/fullwidth.html", "en", reverse_id=Subject.ROOT_REVERSE_ID
        )

        # Submit a slug that is too long and a title that is ok
        invalid_data = {"title": "t" * 255, "slug": "s" * 201}

        form = SubjectWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_subject_wizard_parent_page_should_exist(self):
        """
        We should not be able to create a subject page if the parent page does not exist
        """
        form = SubjectWizardForm(data={"title": "My title", "slug": "my-title"})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a parent page and set its `reverse_id` to `subjects`."
                ]
            },
        )
