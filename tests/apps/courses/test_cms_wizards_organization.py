"""
Test suite for the wizard creating a new Organization page
"""

import random
from unittest import mock

from django.core.exceptions import PermissionDenied
from django.urls import reverse

from cms.api import create_page
from cms.models import Page, PagePermission
from cms.test_utils.testcases import CMSTestCase
from filer.models import FolderPermission

from richie.apps.core.factories import UserFactory
from richie.apps.courses import defaults
from richie.apps.courses.cms_wizards import OrganizationWizardForm
from richie.apps.courses.factories import OrganizationFactory
from richie.apps.courses.models import Organization


class OrganizationCMSWizardTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the Wizard to create organization pages
    """

    # Wizards list

    def test_cms_wizards_organization_create_wizards_list_superuser(self):
        """
        The wizard to create a new Organization page should be present on the wizards list page
        for a superuser.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={page.id:d}"
        response = self.client.get(url)

        # Check that our wizard to create organizations is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new organization page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(
            response, "<strong>New organization page</strong>", html=True
        )

    def test_cms_wizards_organization_create_wizards_list_simple_user(self):
        """
        A simple user trying to access the wizards list page should get a 403 response.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory()
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        page_url = reverse("cms_wizard_create")
        url = f"{page_url:s}?page={page.id:d}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_cms_wizards_organization_create_wizards_list_insufficient_permissions(
        self,
    ):
        """
        The wizard to create a new organization page should not be present on the wizards list page
        for a user with insufficient permissions.
        """
        page = create_page("page", "richie/single_column.html", "en")

        required_permissions = [
            "courses.add_organization",
            "cms.add_page",
            "cms.change_page",
        ]

        page_url = reverse("cms_wizard_create")
        url = f"{page_url:s}?page={page.id:d}"

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

            # Check that our wizard to create organizations is not on this page
            self.assertNotContains(response, "organization", status_code=200, html=True)

    def test_cms_wizards_organization_create_wizards_list_user_with_permissions(self):
        """
        The wizard to create a new organization page should be present on the wizards list page
        for a user with the required permissions.
        """
        page = create_page("page", "richie/single_column.html", "en")

        # Login with a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_organization", "cms.add_page", "cms.change_page"],
        )
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={page.id:d}"
        response = self.client.get(url)

        # Check that our wizard to create organizations is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new organization page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(
            response, "<strong>New organization page</strong>", html=True
        )

    # Form submission

    def test_cms_wizards_organization_submit_form_insufficient_permission(self):
        """
        A user with insufficient permissions trying to submit an OrganizationWizardForm should
        trigger a PermissionDenied exception.
        We make loop to remove each time only one permission from the set of required permissions
        and check that they are all required.
        """
        any_page = create_page("page", "richie/single_column.html", "en")

        # A parent page to list organizations should pre-exist
        create_page(
            "Organizations",
            "richie/single_column.html",
            "en",
            reverse_id="organizations",
        )

        required_permissions = ["courses.add_organization"]

        for is_staff in [True, False]:
            for permission_to_be_removed in required_permissions + [None]:
                if is_staff is True and permission_to_be_removed is None:
                    # This is the case of sufficient permissions treated in the next test
                    continue

                altered_permissions = required_permissions.copy()
                if permission_to_be_removed:
                    altered_permissions.remove(permission_to_be_removed)

                user = UserFactory(is_staff=is_staff, permissions=altered_permissions)

                form = OrganizationWizardForm(
                    data={"title": "My title"},
                    wizard_language="en",
                    wizard_user=user,
                    wizard_page=any_page,
                )

                with self.assertRaises(PermissionDenied):
                    form.is_valid()

    def test_cms_wizards_organization_submit_form(self, *_):
        """
        A user with the required permissions submitting a valid OrganizationWizardForm should be
        able to create a page and its related extension. Admin permissions should be automatically
        assigned to a new group.
        """
        any_page = create_page("page", "richie/single_column.html", "en")

        # A parent page to list organizations should pre-exist
        create_page(
            "Organizations",
            "richie/single_column.html",
            "en",
            reverse_id="organizations",
            published=True,
        )

        # Create a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_organization", "cms.add_page", "cms.change_page"],
        )

        # We can submit a form with just the title set
        form = OrganizationWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=any_page,
        )

        self.assertTrue(form.is_valid())

        role_dict = {
            "django_permissions": ["cms.change_page"],
            "organization_page_permissions": {
                "can_change": random.choice([True, False]),
                "can_add": random.choice([True, False]),
                "can_delete": random.choice([True, False]),
                "can_change_advanced_settings": random.choice([True, False]),
                "can_publish": random.choice([True, False]),
                "can_change_permissions": random.choice([True, False]),
                "can_move_page": random.choice([True, False]),
                "can_view": False,  # can_view = True would make it a view restriction...
                "grant_on": random.randint(1, 5),
            },
            "organization_folder_permissions": {
                "can_read": random.choice([True, False]),
                "can_edit": random.choice([True, False]),
                "can_add_children": random.choice([True, False]),
                "type": random.randint(0, 2),
            },
        }
        with mock.patch.dict(defaults.ORGANIZATION_ADMIN_ROLE, role_dict):
            page = form.save()

        organization = page.organization

        # The page and its related extension have been created as draft
        self.assertEqual(Page.objects.count(), 4)
        self.assertEqual(Page.objects.drafts().count(), 3)
        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")
        # The code is left blank in this case
        self.assertIsNone(organization.code)
        # The page should be in navigation to appear in the breadcrumb
        self.assertTrue(page.in_navigation)

        # A page role should have been created
        self.assertEqual(page.roles.count(), 1)
        role = page.roles.get(role="ADMIN")
        self.assertEqual(role.group.name, "Admin | My title")
        self.assertEqual(role.group.permissions.count(), 1)
        self.assertEqual(role.folder.name, "Admin | My title")

        # All expected permissions should have been assigned to the group:
        # - Django permissions
        self.assertEqual(role.group.permissions.first().codename, "change_page")
        # - DjangoCMS page permissions
        self.assertEqual(PagePermission.objects.filter(group=role.group).count(), 1)
        page_permission = PagePermission.objects.get(group=role.group)
        for key, value in role_dict["organization_page_permissions"].items():
            self.assertEqual(getattr(page_permission, key), value)
        # The Django Filer folder permissions
        self.assertEqual(
            FolderPermission.objects.filter(group_id=role.group_id).count(), 1
        )
        folder_permission = FolderPermission.objects.get(group_id=role.group_id)
        for key, value in role_dict["organization_folder_permissions"].items():
            self.assertEqual(getattr(folder_permission, key), value)

        # The page should be public
        page.publish("en")
        response = self.client.get(page.get_absolute_url())
        self.assertEqual(response.status_code, 200)

    def test_cms_wizards_organization_submit_form_max_lengths(self):
        """
        Check that max lengths on each form field are compatible with max lengths on the
        Page and Organization models. Notably the "path" field on the Page model includes
        the slug + other elements for a max_length of 255.
        """
        # A parent page to list organizations should pre-exist
        create_page(
            "Organizations",
            "richie/single_column.html",
            "en",
            reverse_id="organizations",
        )

        # Submit values at max length on all fields
        data = {"title": "t" * 255, "slug": "s" * 200}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = OrganizationWizardForm(data=data, wizard_language="en", wizard_user=user)

        self.assertTrue(form.is_valid())
        form.save()

        organizations = Organization.objects.all()
        self.assertEqual(len(organizations), 1)
        self.assertIsNone(organizations[0].code)

    def test_cms_wizards_organization_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A parent page to list organizations should pre-exist
        create_page(
            "Organizations",
            "richie/single_column.html",
            "en",
            reverse_id="organizations",
        )

        # Submit a title at max length
        data = {"title": "t" * 255}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = OrganizationWizardForm(data=data, wizard_language="en", wizard_user=user)
        self.assertTrue(form.is_valid())
        page = form.save()

        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_cms_wizards_organization_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # Submit a title that is too long and a slug that is ok
        invalid_data = {"title": "t" * 256, "slug": "s" * 200}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = OrganizationWizardForm(
            data=invalid_data, wizard_language="en", wizard_user=user
        )

        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_cms_wizards_organization_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A parent page to list organizations should pre-exist
        create_page(
            "Organizations",
            "richie/single_column.html",
            "en",
            reverse_id="organizations",
        )
        # Submit a slug that is too long and a title that is ok
        invalid_data = {"title": "t" * 255, "slug": "s" * 201}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = OrganizationWizardForm(
            data=invalid_data, wizard_language="en", wizard_user=user
        )

        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_cms_wizards_organization_submit_form_invalid_slug(self):
        """Trying to submit a slug that is not valid should raise a 400 exception."""
        # A parent page should pre-exist
        create_page(
            "Organizations",
            "richie/single_column.html",
            "en",
            reverse_id=Organization.PAGE["reverse_id"],
        )

        # Submit an invalid slug
        data = {"title": "my title", "slug": "invalid slug"}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = OrganizationWizardForm(data=data, wizard_language="en", wizard_user=user)
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            "Enter a valid “slug” consisting of letters, numbers, underscores or hyphens.",
        )

    def test_cms_wizards_organization_submit_form_slug_duplicate(self):
        """
        Trying to create an organization with a slug that would lead to a duplicate path should
        raise a validation error.
        """
        # A parent page should pre-exist
        parent_page = create_page(
            "Organizations",
            "richie/single_column.html",
            "en",
            reverse_id=Organization.PAGE["reverse_id"],
        )
        # Create an existing page with a known slug
        OrganizationFactory(page_parent=parent_page, page_title="My title")

        # Submit a title that will lead to the same slug
        data = {"title": "my title"}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = OrganizationWizardForm(data=data, wizard_language="en", wizard_user=user)

        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"slug": ["This slug is already in use"]})

    def test_cms_wizards_organization_parent_page_should_exist(self):
        """
        We should not be able to create a CMS Organization Page if the
        parent page to list organizations was not created
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        form = OrganizationWizardForm(
            data={"title": "My title"}, wizard_language="en", wizard_user=user
        )

        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a parent page and set its `reverse_id` to "
                    "`organizations`."
                ]
            },
        )
