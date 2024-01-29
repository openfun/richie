"""
Test suite for the wizard creating a new Person page
"""

from django.core.exceptions import PermissionDenied
from django.urls import reverse

from cms.api import Page, create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_wizards import PersonWizardForm
from richie.apps.courses.factories import PersonFactory
from richie.apps.courses.models import Person


class PersonCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new person pages from the CMS"""

    # Wizards list

    def test_cms_wizards_person_create_wizards_list_superuser(self):
        """
        The wizard to create a new person page should be present on the wizards list page
        for a superuser.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        path = reverse("cms_wizard_create")
        url = f"{path:s}?page={page.id:d}"
        response = self.client.get(url)

        # Check that our wizard to create persons is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new person page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New person page</strong>", html=True)

    def test_cms_wizards_person_create_wizards_list_insufficient_permissions(self):
        """
        The wizard to create a new person page should not be present on the wizards list page
        for a user with insufficient permissions.
        """
        page = create_page("page", "richie/single_column.html", "en")

        required_permissions = ["courses.add_person", "cms.add_page", "cms.change_page"]

        path = reverse("cms_wizard_create")
        url = f"{path:s}?page={page.id:d}"

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

            # Check that our wizard to create persons is not on this page
            self.assertNotContains(response, "person", status_code=200, html=True)

    def test_cms_wizards_person_create_wizards_list_user_with_permissions(self):
        """
        The wizard to create a new person page should be present on the wizards list page
        for a user with the required permissions.
        """
        page = create_page("page", "richie/single_column.html", "en")

        # Login with a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_person", "cms.add_page", "cms.change_page"],
        )
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        path = reverse("cms_wizard_create")
        url = f"{path:s}?page={page.id:d}"
        response = self.client.get(url)

        # Check that our wizard to create persons is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new person page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New person page</strong>", html=True)

    # Form submission

    def test_cms_wizards_person_submit_form_insufficient_permission(self):
        """
        A user with insufficient permissions trying to submit a PersonWizardForm should trigger
        a PermissionDenied exception.
        We make loop to remove each time only one permission from the set of required permissions
        and check that they are all required.
        """
        any_page = create_page("page", "richie/single_column.html", "en")

        # A parent page should pre-exist
        create_page(
            "Persons",
            "richie/single_column.html",
            "en",
            reverse_id=Person.PAGE["reverse_id"],
        )

        required_permissions = ["courses.add_person"]

        for is_staff in [True, False]:
            for permission_to_be_removed in required_permissions + [None]:
                if is_staff is True and permission_to_be_removed is None:
                    # This is the case of sufficient permissions treated in the next test
                    continue

                altered_permissions = required_permissions.copy()
                if permission_to_be_removed:
                    altered_permissions.remove(permission_to_be_removed)

                user = UserFactory(is_staff=is_staff, permissions=altered_permissions)

                form = PersonWizardForm(
                    data={"title": "A person"},
                    wizard_language="en",
                    wizard_user=user,
                    wizard_page=any_page,
                )

                with self.assertRaises(PermissionDenied):
                    form.is_valid()

    def test_cms_wizards_person_submit_form(self):
        """
        A user with the required permissions submitting a valid PersonWizardForm should be able
        to create a Person page extension and its related page.
        """
        any_page = create_page("page", "richie/single_column.html", "en")

        # A parent page should pre-exist
        create_page(
            "Persons",
            "richie/single_column.html",
            "en",
            reverse_id=Person.PAGE["reverse_id"],
        )

        # Create a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_person", "cms.add_page", "cms.change_page"],
        )

        form = PersonWizardForm(
            data={"title": "A person"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=any_page,
        )
        self.assertTrue(form.is_valid())
        page = form.save()

        # Related page should have been created as draft
        Page.objects.drafts().get(id=page.id)
        Person.objects.get(id=page.person.id, extended_object=page)

        self.assertEqual(page.get_title(), "A person")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "a-person")
        # The page should be in navigation to appear in the breadcrumb
        self.assertTrue(page.in_navigation)

    def test_cms_wizards_person_submit_form_max_lengths(self):
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
            reverse_id=Person.PAGE["reverse_id"],
        )

        # A person with a slug at the limit length should work
        user = UserFactory(is_superuser=True, is_staff=True)
        form = PersonWizardForm(
            data={"title": "t" * 255, "slug": "s" * 54},
            wizard_language="en",
            wizard_user=user,
        )
        self.assertTrue(form.is_valid())
        form.save()

        # A person with a slug too long with regards to the parent's one should raise an error
        form = PersonWizardForm(
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

    def test_cms_wizards_person_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A parent page should pre-exist
        create_page(
            "Persons",
            "richie/single_column.html",
            "en",
            reverse_id=Person.PAGE["reverse_id"],
        )

        # Submit a title at max length
        data = {"title": "t" * 255}
        user = UserFactory(is_superuser=True, is_staff=True)
        form = PersonWizardForm(data=data, wizard_language="en", wizard_user=user)
        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_cms_wizards_person_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Persons",
            "richie/single_column.html",
            "en",
            reverse_id=Person.PAGE["reverse_id"],
        )

        # Submit a title that is too long and a slug that is ok
        invalid_data = {"title": "t" * 256, "slug": "s" * 200}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = PersonWizardForm(
            data=invalid_data, wizard_language="en", wizard_user=user
        )
        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_cms_wizards_person_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Persons",
            "richie/single_column.html",
            "en",
            reverse_id=Person.PAGE["reverse_id"],
        )

        # Submit a slug that is too long and a title that is ok
        invalid_data = {"title": "t" * 255, "slug": "s" * 201}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = PersonWizardForm(
            data=invalid_data, wizard_language="en", wizard_user=user
        )
        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_cms_wizards_person_submit_form_invalid_slug(self):
        """Trying to submit a slug that is not valid should raise a 400 exception."""
        # A parent page should pre-exist
        create_page(
            "Persons",
            "richie/single_column.html",
            "en",
            reverse_id=Person.PAGE["reverse_id"],
        )

        # Submit an invalid slug
        data = {"title": "my title", "slug": "invalid slug"}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = PersonWizardForm(data=data, wizard_language="en", wizard_user=user)
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            "Enter a valid “slug” consisting of letters, numbers, underscores or hyphens.",
        )

    def test_cms_wizards_person_submit_form_slug_duplicate(self):
        """
        Trying to create a person with a slug that would lead to a duplicate path should
        raise a validation error.
        """
        # A parent page should pre-exist
        parent_page = create_page(
            "Persons",
            "richie/single_column.html",
            "en",
            reverse_id=Person.PAGE["reverse_id"],
        )
        # Create an existing page with a known slug
        PersonFactory(page_parent=parent_page, page_title="My title")

        # Submit a title that will lead to the same slug
        data = {"title": "my title"}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = PersonWizardForm(data=data, wizard_language="en", wizard_user=user)
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"slug": ["This slug is already in use"]})

    def test_cms_wizards_person_parent_page_should_exist(self):
        """
        We should not be able to create a person page if the parent page does not exist
        """
        user = UserFactory(is_superuser=True, is_staff=True)

        form = PersonWizardForm(
            data={"title": "A person"}, wizard_language="en", wizard_user=user
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a parent page and set its `reverse_id` to `persons`."
                ]
            },
        )
