"""
Test suite for the wizard creating a new Program page
"""

from django.core.exceptions import PermissionDenied
from django.urls import reverse

from cms.api import Page, create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_wizards import ProgramWizardForm
from richie.apps.courses.factories import ProgramFactory
from richie.apps.courses.models import Program


class ProgramCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new program pages from the CMS"""

    # Wizards list

    def test_cms_wizards_program_create_wizards_list_superuser(self):
        """
        The wizard to create a new program page should be present on the wizards list page
        for a superuser.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={page.id:d}"
        response = self.client.get(url)

        # Check that our wizard to create programs is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new program</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New program</strong>", html=True)

    def test_cms_wizards_program_create_wizards_list_insufficient_permissions(self):
        """
        The wizard to create a new program page should not be present on the wizards list page
        for a user with insufficient permissions.
        """
        any_page = create_page("page", "richie/single_column.html", "en")

        required_permissions = [
            "courses.add_program",
            "cms.add_page",
            "cms.change_page",
        ]

        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={any_page.id:d}"

        for permission_to_be_removed in required_permissions + [None]:
            if permission_to_be_removed is None:
                # This is the case of sufficient permissions treated in the next test
                continue

            altered_permissions = required_permissions.copy()
            if permission_to_be_removed:
                altered_permissions.remove(permission_to_be_removed)

            user = UserFactory(is_staff=True, permissions=altered_permissions)
            self.client.login(username=user.username, password="password")

            # Let the authorized user get the page with all wizards listed
            response = self.client.get(url)

            # Check that our wizard to create programs is not on this page
            self.assertNotContains(response, "new program", status_code=200, html=True)

    def test_cms_wizards_program_create_wizards_list_user_with_permissions(self):
        """
        The wizard to create a new program page should be present on the wizards list page
        for a user with the required permissions.
        """
        any_page = create_page("page", "richie/single_column.html", "en")

        # Login with a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_program", "cms.add_page", "cms.change_page"],
        )
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={any_page.id:d}"
        response = self.client.get(url)

        # Check that our wizard to create programs is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new program</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New program</strong>", html=True)

    # Form submission

    def test_cms_wizards_program_submit_form_insufficient_permission(self):
        """
        A user with insufficient permissions trying to submit a ProgramWizardForm should trigger
        a PermissionDenied exception.
        We make loop to remove each time only one permission from the set of required permissions
        and check that they are all required.
        """
        any_page = create_page("Any page", "richie/single_column.html", "en")

        # A parent page should pre-exist
        create_page(
            "News",
            "richie/single_column.html",
            "en",
            reverse_id=Program.PAGE["reverse_id"],
        )

        required_permissions = ["courses.add_program"]

        for is_staff in [True, False]:
            for permission_to_be_removed in required_permissions + [None]:
                if is_staff is True and permission_to_be_removed is None:
                    # This is the case of sufficient permissions treated in the next test
                    continue

                altered_permissions = required_permissions.copy()
                if permission_to_be_removed:
                    altered_permissions.remove(permission_to_be_removed)

                user = UserFactory(is_staff=is_staff, permissions=altered_permissions)

                form = ProgramWizardForm(
                    data={"title": "My title"},
                    wizard_language="en",
                    wizard_user=user,
                    wizard_page=any_page,
                )

                with self.assertRaises(PermissionDenied):
                    form.is_valid()

    def test_cms_wizards_program_submit_form(self):
        """
        A user with the required permissions submitting a valid ProgramWizardForm should be able
        to create a Program page extension and its related page.
        """
        any_page = create_page("Any page", "richie/single_column.html", "en")

        # A parent page should pre-exist
        create_page(
            "News",
            "richie/single_column.html",
            "en",
            reverse_id=Program.PAGE["reverse_id"],
        )

        # Create a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_program", "cms.add_page", "cms.change_page"],
        )

        # We can submit a form with just the title set
        form = ProgramWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=any_page,
        )
        self.assertTrue(form.is_valid())
        program_page = form.save()

        # Related page should have been created as draft
        Page.objects.drafts().get(id=program_page.id)
        Program.objects.get(id=program_page.program.id, extended_object=program_page)

        self.assertEqual(program_page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(program_page.get_slug(), "my-title")
        # The page should be in navigation to appear in the breadcrumb
        self.assertTrue(program_page.in_navigation)

    def test_cms_wizards_program_submit_form_max_lengths(self):
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
            reverse_id=Program.PAGE["reverse_id"],
        )

        # A program with a slug at the limit length should work
        user = UserFactory(is_staff=True, is_superuser=True)
        form = ProgramWizardForm(
            data={"title": "t" * 255, "slug": "s" * 54},
            wizard_language="en",
            wizard_user=user,
        )
        self.assertTrue(form.is_valid())
        form.save()

        # A program with a slug too long with regards to the parent's one should raise an error
        form = ProgramWizardForm(
            data={"title": "t" * 255, "slug": "s" * 55},
            wizard_language="en",
            wizard_user=user,
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            (
                "This slug is too long. The length of the path built by prepending the slug of "
                "the parent page would be 256 characters long and it should be less than 255"
            ),
        )

    def test_cms_wizards_program_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A parent page should pre-exist
        create_page(
            "News",
            "richie/single_column.html",
            "en",
            reverse_id=Program.PAGE["reverse_id"],
        )

        # Submit a title at max length
        data = {"title": "t" * 255}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = ProgramWizardForm(data=data, wizard_language="en", wizard_user=user)

        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_cms_wizards_program_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "News",
            "richie/single_column.html",
            "en",
            reverse_id=Program.PAGE["reverse_id"],
        )

        # Submit a title that is too long and a slug that is ok
        invalid_data = {"title": "t" * 256, "slug": "s" * 200}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = ProgramWizardForm(
            data=invalid_data, wizard_language="en", wizard_user=user
        )

        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_cms_wizards_program_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "News",
            "richie/single_column.html",
            "en",
            reverse_id=Program.PAGE["reverse_id"],
        )

        # Submit a slug that is too long and a title that is ok
        invalid_data = {"title": "t" * 255, "slug": "s" * 201}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = ProgramWizardForm(
            data=invalid_data, wizard_language="en", wizard_user=user
        )

        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_cms_wizards_program_submit_form_invalid_slug(self):
        """Trying to submit a slug that is not valid should raise a 400 exception."""
        # A parent page should pre-exist
        create_page(
            "News",
            "richie/single_column.html",
            "en",
            reverse_id=Program.PAGE["reverse_id"],
        )

        # Submit an invalid slug
        data = {"title": "my title", "slug": "invalid slug"}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = ProgramWizardForm(data=data, wizard_language="en", wizard_user=user)
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            "Enter a valid “slug” consisting of letters, numbers, underscores or hyphens.",
        )

    def test_cms_wizards_program_submit_form_slug_duplicate(self):
        """
        Trying to create a program with a slug that would lead to a duplicate path should
        raise a validation error.
        """
        # A parent page should pre-exist
        parent_page = create_page(
            "News",
            "richie/single_column.html",
            "en",
            reverse_id=Program.PAGE["reverse_id"],
        )
        # Create an existing page with a known slug
        ProgramFactory(page_parent=parent_page, page_title="My title")

        # Submit a title that will lead to the same slug
        data = {"title": "my title"}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = ProgramWizardForm(data=data, wizard_language="en", wizard_user=user)

        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"slug": ["This slug is already in use"]})

    def test_cms_wizards_program_parent_page_should_exist(self):
        """
        We should not be able to create a program page if the parent page does not exist
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        form = ProgramWizardForm(
            data={"title": "My title", "slug": "my-title"},
            wizard_language="en",
            wizard_user=user,
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a parent page and set its `reverse_id` to `programs`."
                ]
            },
        )
