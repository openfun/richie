"""
Test suite for the wizard creating a new Category page
"""
from django.urls import reverse

from cms.api import create_page
from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_wizards import CategoryWizardForm
from richie.apps.courses.models import Category


class CategoryCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new category pages from the CMS"""

    def test_cms_wizards_category_create_wizards_list(self):
        """
        The wizard to create a new category page should be present on the wizards list page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = reverse("cms_wizard_create")
        response = self.client.get(url)

        # Check that our wizard to create courses is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new category page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New category page</strong>", html=True)

    def test_cms_wizards_category_submit_form(self):
        """
        Submitting a valid CategoryWizardForm should create a Category page extension and its
        related page.
        """
        # A parent page should pre-exist
        create_page(
            "Categories",
            "richie/single_column.html",
            "en",
            reverse_id=Category.ROOT_REVERSE_ID,
        )
        # We can submit a form with just the title set
        form = CategoryWizardForm(data={"title": "My title"})
        self.assertTrue(form.is_valid())
        page = form.save()

        # Related page should have been created as draft
        Page.objects.drafts().get(id=page.id)
        Category.objects.get(id=page.category.id, extended_object=page)

        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")

    def test_cms_wizards_category_submit_form_max_lengths(self):
        """
        Check that the form correctly raises an error when the slug is too long. The path built
        by combining the slug of the page with the slug of its parent page, should not exceed
        255 characters in length.
        """
        # A parent page with a very long slug
        create_page(
            "y" * 200,
            "richie/single_column.html",
            "en",
            reverse_id=Category.ROOT_REVERSE_ID,
        )

        # A category with a slug at the limit length should work
        form = CategoryWizardForm(data={"title": "t" * 255, "slug": "s" * 54})
        self.assertTrue(form.is_valid())
        form.save()

        # A category with a slug too long with regards to the parent's one should raise an error
        form = CategoryWizardForm(data={"title": "t" * 255, "slug": "s" * 55})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            (
                "This slug is too long. The length of the path built by prepending the slug of "
                "the parent page would be 256 characters long and it should be less than 255"
            ),
        )

    def test_cms_wizards_category_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A parent page should pre-exist
        create_page(
            "Categories",
            "richie/single_column.html",
            "en",
            reverse_id=Category.ROOT_REVERSE_ID,
        )

        # Submit a title at max length
        data = {"title": "t" * 255}

        form = CategoryWizardForm(data=data)
        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_cms_wizards_category_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Categories",
            "richie/single_column.html",
            "en",
            reverse_id=Category.ROOT_REVERSE_ID,
        )

        # Submit a title that is too long and a slug that is ok
        invalid_data = {"title": "t" * 256, "slug": "s" * 200}

        form = CategoryWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_cms_wizards_category_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Sujects",
            "richie/single_column.html",
            "en",
            reverse_id=Category.ROOT_REVERSE_ID,
        )

        # Submit a slug that is too long and a title that is ok
        invalid_data = {"title": "t" * 255, "slug": "s" * 201}

        form = CategoryWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_cms_wizards_category_parent_page_should_exist(self):
        """
        We should not be able to create a category page if the parent page does not exist
        """
        form = CategoryWizardForm(data={"title": "My title", "slug": "my-title"})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a parent page and set its `reverse_id` to `categories`."
                ]
            },
        )
