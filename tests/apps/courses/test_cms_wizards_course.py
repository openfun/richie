"""
Test suite for the wizard creating a new Course page
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
from richie.apps.courses.cms_wizards import CourseWizardForm
from richie.apps.courses.factories import CourseFactory, OrganizationFactory
from richie.apps.courses.models import Course, Organization, OrganizationPluginModel

# pylint: disable=too-many-locals


class CourseCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new course pages from the CMS"""

    # Wizards list

    def test_cms_wizards_course_create_wizards_list_superuser_any_page(self):
        """
        The wizard to create a new Course page should not be present on the wizards list page
        for a superuser visiting any page.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={page.id:d}"
        response = self.client.get(url)

        # Check that our wizard to create courses is not on this page
        self.assertNotContains(response, "course", status_code=200, html=True)

    def test_cms_wizards_course_create_wizards_list_superuser_organization_page(self):
        """
        The wizard to create a new Course page should be present on the wizards list page
        for a superuser visiting an organization page.
        """
        organization = OrganizationFactory()
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={organization.extended_object_id:d}"
        response = self.client.get(url)

        # Check that our wizard to create courses is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new course page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New course page</strong>", html=True)

    def test_cms_wizards_course_create_wizards_list_insufficient_permissions(self, *_):
        """
        The wizard to create a new course page should not be present on the wizards list page
        for a user with insufficient permissions.
        """
        organization = OrganizationFactory()

        required_permissions = ["courses.add_course", "cms.add_page", "cms.change_page"]
        required_page_permissions = ["can_add", "can_change"]

        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={organization.extended_object_id:d}"

        for permission_to_be_removed in required_permissions + [None]:
            for page_permission_to_be_removed in required_page_permissions + [None]:
                if (
                    permission_to_be_removed is None
                    and page_permission_to_be_removed is None
                ):
                    # This is the case of sufficient permissions treated in the next test
                    continue

                altered_permissions = required_permissions.copy()
                if permission_to_be_removed:
                    altered_permissions.remove(permission_to_be_removed)

                altered_page_permissions = required_page_permissions.copy()
                if page_permission_to_be_removed:
                    altered_page_permissions.remove(page_permission_to_be_removed)

                user = UserFactory(is_staff=True, permissions=altered_permissions)
                PagePermission.objects.create(
                    page=organization.extended_object,
                    user=user,
                    can_add="can_add" in altered_page_permissions,
                    can_change="can_change" in altered_page_permissions,
                    can_delete=False,
                    can_publish=False,
                    can_move_page=False,
                )
                self.client.login(username=user.username, password="password")

                # Let the authorized user get the page with all wizards listed
                response = self.client.get(url)

                # Check that our wizard to create courses is not on this page
                self.assertNotContains(response, "course", status_code=200, html=True)

    def test_cms_wizards_course_create_wizards_list_user_with_permissions(self, *_):
        """
        The wizard to create a new course page should be present on the wizards list page
        for a user with the required permissions visiting an organization page that he can
        change.
        """
        organization = OrganizationFactory()

        # Login with a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_course", "cms.add_page", "cms.change_page"],
        )
        PagePermission.objects.create(
            page=organization.extended_object,
            user=user,
            can_add=True,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        reverse_id = reverse("cms_wizard_create")
        url = f"{reverse_id:s}?page={organization.extended_object_id:d}"
        response = self.client.get(url)

        # Check that our wizard to create courses is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new course page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New course page</strong>", html=True)

    # Form submission

    def test_cms_wizards_course_submit_form_insufficient_permission(self):
        """
        A user with insufficient permissions trying to submit a CourseWizardForm should trigger
        a PermissionDenied exception.
        We make loop to remove each time only one permission from the set of required permissions
        and check that they are all required.
        """
        organization = OrganizationFactory()

        # A parent page should pre-exist
        create_page(
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )

        required_permissions = ["courses.add_course"]
        required_page_permissions = ["can_change"]

        for is_staff in [True, False]:
            for permission_to_be_removed in required_permissions + [None]:
                for page_permission_to_be_removed in required_page_permissions + [None]:
                    if (
                        is_staff is True
                        and permission_to_be_removed is None
                        and page_permission_to_be_removed is None
                    ):
                        # This is the case of sufficient permissions treated in the next test
                        continue

                    altered_permissions = required_permissions.copy()
                    if permission_to_be_removed:
                        altered_permissions.remove(permission_to_be_removed)

                    altered_page_permissions = required_page_permissions.copy()
                    if page_permission_to_be_removed:
                        altered_page_permissions.remove(page_permission_to_be_removed)

                    user = UserFactory(
                        is_staff=is_staff, permissions=altered_permissions
                    )
                    PagePermission.objects.create(
                        page=organization.extended_object,
                        user=user,
                        can_add="can_add" in altered_page_permissions,
                        can_change="can_change" in altered_page_permissions,
                        can_delete=False,
                        can_publish=False,
                        can_move_page=False,
                    )

                    form = CourseWizardForm(
                        data={"title": "My title"},
                        wizard_language="en",
                        wizard_user=user,
                        wizard_page=organization.extended_object,
                    )

                    with self.assertRaises(PermissionDenied):
                        form.is_valid()

    def test_cms_wizards_course_submit_form_from_any_page(self):
        """
        A user with the required permissions submitting a valid CourseWizardForm when visiting
        any page, should not be allowed to create a course and its related page.
        """
        any_page = create_page("page", "richie/single_column.html", "en")

        # A parent page should pre-exist
        create_page(
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
            published=True,
        )

        # Create a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_course", "cms.add_page", "cms.change_page"],
        )

        # We can submit a form omitting the slug
        form = CourseWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=any_page,
        )

        with self.assertRaises(PermissionDenied):
            self.assertTrue(form.is_valid())

    def test_cms_wizards_course_submit_form_from_organization_page(self):
        """
        A user with the required permissions submitting a valid CourseWizardForm when visiting
        an organization page, should be able to create a course and its related page
        automatically related to the organization via a plugin.
        """
        # A parent page should pre-exist
        create_page(
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
            published=True,
        )

        organization = OrganizationFactory()
        organization_page_role = organization.create_page_role()

        # Create a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_course", "cms.add_page", "cms.change_page"],
        )
        PagePermission.objects.create(
            page=organization.extended_object,
            user=user,
            can_add=True,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        # We can submit a form omitting the slug
        form = CourseWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
        )
        self.assertTrue(form.is_valid())

        course_role_dict = {
            "django_permissions": ["cms.change_page"],
            "course_page_permissions": {
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
            "course_folder_permissions": {
                "can_read": random.choice([True, False]),
                "can_edit": random.choice([True, False]),
                "can_add_children": random.choice([True, False]),
                "type": random.randint(0, 2),
            },
        }
        organization_role_dict = {
            "courses_page_permissions": {
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
            "courses_folder_permissions": {
                "can_read": random.choice([True, False]),
                "can_edit": random.choice([True, False]),
                "can_add_children": random.choice([True, False]),
                "type": random.randint(0, 2),
            },
        }
        with mock.patch.dict(defaults.ORGANIZATION_ADMIN_ROLE, organization_role_dict):
            with mock.patch.dict(defaults.COURSE_ADMIN_ROLE, course_role_dict):
                page = form.save()

        # The course and its related page should have been created as draft
        Page.objects.drafts().get(id=page.id, course__isnull=False)

        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")
        # The page should be in navigation to appear in the breadcrumb
        self.assertTrue(page.in_navigation)

        # The course should have a plugin with the organization
        self.assertEqual(OrganizationPluginModel.objects.count(), 1)
        plugin = OrganizationPluginModel.objects.first()
        self.assertEqual(plugin.page_id, organization.extended_object_id)

        # A page role should have been created for the course page
        self.assertEqual(page.roles.count(), 1)
        course_role = page.roles.get(role="ADMIN")
        self.assertEqual(course_role.group.name, "Admin | My title")
        self.assertEqual(course_role.group.permissions.count(), 1)
        self.assertEqual(course_role.folder.name, "Admin | My title")

        # All expected permissions should have been assigned to the group:
        # - Django permissions
        self.assertEqual(course_role.group.permissions.first().codename, "change_page")
        # - DjangoCMS page permissions
        self.assertEqual(
            PagePermission.objects.filter(group_id=course_role.group_id).count(), 1
        )
        page_permission = PagePermission.objects.get(group_id=course_role.group_id)
        for key, value in course_role_dict["course_page_permissions"].items():
            self.assertEqual(getattr(page_permission, key), value)
        # The Django Filer folder permissions
        self.assertEqual(
            FolderPermission.objects.filter(group_id=course_role.group_id).count(), 1
        )
        folder_permission = FolderPermission.objects.get(
            group_id=course_role.group_id, folder_id=course_role.folder_id
        )
        for key, value in course_role_dict["course_folder_permissions"].items():
            self.assertEqual(getattr(folder_permission, key), value)

        # A page permission should have been created for the organization admin role
        permission_query = PagePermission.objects.filter(
            group_id=organization_page_role.group_id, page=page
        )
        self.assertEqual(permission_query.count(), 1)
        page_permission = permission_query.get()
        for key, value in organization_role_dict["courses_page_permissions"].items():
            self.assertEqual(getattr(page_permission, key), value)

        # A Filer folder permission should have been created for the organization admin role
        folder_query = FolderPermission.objects.filter(
            group_id=organization_page_role.group_id, folder_id=course_role.folder_id
        )
        self.assertEqual(folder_query.count(), 1)
        folder_permission = folder_query.get()
        for key, value in organization_role_dict["courses_folder_permissions"].items():
            self.assertEqual(getattr(folder_permission, key), value)

        # The page should be public
        page.publish("en")
        response = self.client.get(page.get_absolute_url())
        self.assertEqual(response.status_code, 200)

    @mock.patch.object(Organization, "create_page_role", return_value=None)
    def test_cms_wizards_course_submit_form_from_organization_page_no_role(self, *_):
        """
        Creating a course via the wizard should not fail if the organization has no associated
        page role.
        """
        # A parent page should pre-exist
        create_page(
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )

        organization = OrganizationFactory()
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
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

        # The course should have a plugin with the organization
        self.assertEqual(OrganizationPluginModel.objects.count(), 1)
        plugin = OrganizationPluginModel.objects.first()
        self.assertEqual(plugin.page_id, organization.extended_object_id)

        # No other permissions should have been created
        self.assertFalse(
            PagePermission.objects.filter(page=organization.extended_object).exists()
        )

    def test_cms_wizards_course_submit_form_max_lengths(self):
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
            reverse_id=Course.PAGE["reverse_id"],
        )

        # An organization with a slug at the limit length should work
        organization = OrganizationFactory()
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseWizardForm(
            data={
                "title": "t" * 255,
                "slug": "s" * 54,
                "organization": organization.id,
            },
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
        )

        self.assertTrue(form.is_valid())
        form.save()

        # An organization with a slug too long with regards to the parent's one should raise an
        # error
        form = CourseWizardForm(
            data={
                "title": "t" * 255,
                "slug": "s" * 55,
                "organization": organization.id,
            },
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
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
        page = create_page(
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )

        # Submit a title at max length
        data = {"title": "t" * 255, "organization": organization.id}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseWizardForm(
            data=data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
        )

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
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )
        # Submit a title that is too long and a slug that is ok
        invalid_data = {
            "title": "t" * 256,
            "slug": "s" * 200,
            "organization": organization.id,
        }

        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseWizardForm(
            data=invalid_data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
        )

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
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )
        # Submit a slug that is too long and a title that is ok
        invalid_data = {
            "title": "t" * 255,
            "slug": "s" * 201,
            "organization": organization.id,
        }
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseWizardForm(
            data=invalid_data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
        )

        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_cms_wizards_course_submit_form_invalid_slug(self):
        """Trying to submit a slug that is not valid should raise a 400 exception."""
        # An organization and a parent page should pre-exist
        organization = OrganizationFactory()
        create_page(
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )

        # Submit an invalid slug
        data = {"title": "my title", "slug": "invalid slug"}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = CourseWizardForm(
            data=data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            "Enter a valid “slug” consisting of letters, numbers, underscores or hyphens.",
        )

    def test_cms_wizards_course_submit_form_slug_duplicate(self):
        """
        Trying to create a course with a slug that would lead to a duplicate path should
        raise a validation error.
        """
        # An organization and a parent page should pre-exist
        organization = OrganizationFactory()
        parent_page = create_page(
            "Courses",
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )
        # Create an existing page with a known slug
        CourseFactory(page_parent=parent_page, page_title="My title")

        # Submit a title that will lead to the same slug
        data = {"title": "my title"}

        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseWizardForm(
            data=data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"slug": ["This slug is already in use"]})

    def test_cms_wizards_course_parent_page_should_exist(self):
        """
        We should not be able to create a course page if the courses root page does not exist.
        """
        organization = OrganizationFactory()
        create_page(" Not the root courses page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseWizardForm(
            data={"title": "My title", "organization": organization.id},
            wizard_language="en",
            wizard_user=user,
            wizard_page=organization.extended_object,
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
