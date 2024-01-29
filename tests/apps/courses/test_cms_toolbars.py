"""
Test suite of the toolbar extension for organization pages
"""

from random import choice

from django.contrib.auth.models import AnonymousUser, Permission
from django.test.utils import override_settings

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.items import AjaxItem, Menu, ModalItem

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    CourseFactory,
    OrganizationFactory,
    PersonFactory,
)

from ..core.utils import CheckToolbarMixin


# pylint: disable=too-many-ancestors
class CoursesCMSToolbarTestCase(CheckToolbarMixin, CMSTestCase):
    """Testing the integration of page extensions in the toolbar for the courses application"""

    def get_cases_for_page_change(self):
        """
        Not a test, a helper to create different users for each possible level of access
        and specify their expected visibility on the menu item..
        pylint: disable=too-many-locals
        """
        superuser = UserFactory(is_staff=True, is_superuser=True)
        staff_with_permission = UserFactory(is_staff=True)
        user_with_permission = UserFactory()
        staff = UserFactory(is_staff=True)
        user = UserFactory()
        anonymous = AnonymousUser()

        # Add global permission to change page for users concerned
        can_change_page = Permission.objects.get(codename="change_page")
        staff_with_permission.user_permissions.add(can_change_page)
        user_with_permission.user_permissions.add(can_change_page)

        return [
            ([superuser, False, False], self.check_disabled),
            ([superuser, True, False], self.check_active),
            ([superuser, False, True], self.check_disabled),
            ([staff_with_permission, False, False], self.check_disabled),
            ([staff_with_permission, True, False], self.check_active),
            ([staff_with_permission, False, True], self.check_disabled),
            ([staff, False, False], self.check_missing),
            ([staff, True, False], self.check_missing),
            ([staff, False, True], self.check_missing),
            ([user_with_permission, False, False], self.check_absent),
            ([user_with_permission, True, False], self.check_absent),
            ([user_with_permission, False, True], self.check_absent),
            ([user, False, False], self.check_absent),
            ([user, True, False], self.check_absent),
            ([user, False, True], self.check_absent),
            ([anonymous, False, False], self.check_absent),
            ([anonymous, True, False], self.check_absent),
            ([anonymous, False, True], self.check_absent),
        ]

    @override_settings(CMS_PERMISSION=False)
    def test_cms_toolbars_course_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the course is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        course = CourseFactory()
        url = f"/en/admin/courses/course/{course.id:d}/change/"

        for args, method in self.get_cases_for_page_change():
            toolbar = self.get_toolbar_for_page(course.extended_object, *args)
            item = method(toolbar, "Course settings...")
            if item:
                self.assertEqual(item.url, url)

    # pylint: disable=too-many-locals
    def test_cms_toolbars_course_has_snapshot_item(self):
        """
        Validate that a new item to snapshot the course is available only when visiting the page
        in edit mode and for users with permission to snapshot the page.
        """
        course = CourseFactory()

        superuser = UserFactory(is_staff=True, is_superuser=True)
        staff_with_permission = UserFactory(is_staff=True)
        user_with_permission = UserFactory()
        unauthorized_staff = UserFactory(is_staff=True)
        unauthorized_user = UserFactory()
        anonymous = AnonymousUser()

        # Add all permissions to snapshot page for users with permissions
        for user in [staff_with_permission, user_with_permission]:
            self.add_permission(user, "add_page")
            self.add_permission(user, "change_page")
            self.add_page_permission(
                user, course.extended_object, can_change=True, can_add=True
            )

        # Randomly add only half of the necessary permissions for unauthorized users
        for user in [unauthorized_staff, unauthorized_user]:
            self.add_permission(user, "add_page")
            self.add_permission(user, "change_page")
            can_change = choice([True, False])
            self.add_page_permission(
                user,
                course.extended_object,
                can_change=can_change,
                can_add=not can_change,
            )

        cases = [
            ([superuser, False, False], self.check_disabled),
            ([superuser, True, False], self.check_active),
            ([superuser, False, True], self.check_disabled),
            ([staff_with_permission, False, False], self.check_disabled),
            ([staff_with_permission, True, False], self.check_active),
            ([staff_with_permission, False, True], self.check_disabled),
            ([unauthorized_staff, False, False], self.check_missing),
            ([unauthorized_staff, True, False], self.check_missing),
            ([unauthorized_staff, False, True], self.check_missing),
            ([user_with_permission, False, False], self.check_absent),
            ([user_with_permission, True, False], self.check_absent),
            ([user_with_permission, False, True], self.check_absent),
            ([unauthorized_user, False, False], self.check_absent),
            ([unauthorized_user, True, False], self.check_absent),
            ([unauthorized_user, False, True], self.check_absent),
            ([anonymous, False, False], self.check_absent),
            ([anonymous, True, False], self.check_absent),
            ([anonymous, False, True], self.check_absent),
        ]

        url = f"/en/admin/courses/course/{course.id:d}/snapshot/"
        for args, method in cases:
            toolbar = self.get_toolbar_for_page(course.extended_object, *args)
            item = method(toolbar, "Snapshot this page...", item_type=AjaxItem)
            if item:
                self.assertEqual(item.action, url)

    def test_cms_toolbars_snapshot_no_snapshot_item(self):
        """
        Make sure that the item to snapshot a course is not available on the page of a snapshot.
        """
        course = CourseFactory()
        snapshot = CourseFactory(page_parent=course.extended_object)

        superuser = UserFactory(is_staff=True, is_superuser=True)
        cases = [
            [superuser, False, False],
            [superuser, True, False],
            [superuser, False, True],
        ]

        for args in cases:
            toolbar = self.get_toolbar_for_page(snapshot.extended_object, *args)
            self.check_missing(toolbar, "Snapshot this page...", item_type=AjaxItem)

    @override_settings(CMS_PERMISSION=False)
    def test_cms_toolbars_organization_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the organization is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        organization = OrganizationFactory()
        url = f"/en/admin/courses/organization/{organization.id:d}/change/"

        for args, method in self.get_cases_for_page_change():
            toolbar = self.get_toolbar_for_page(organization.extended_object, *args)
            item = method(toolbar, "Organization settings...")
            if item:
                self.assertEqual(item.url, url)

    @override_settings(CMS_PERMISSION=False)
    def test_cms_toolbars_no_page_extension(self):
        """
        The toolbar should not include any item to edit a page extension on a page not related
        to any page extension.
        """
        # Testing with a superuser proves our point
        superuser = UserFactory(is_staff=True, is_superuser=True)

        # Create a page not related to any page extension
        page = create_page(
            "A page", template="richie/single_column.html", language="en"
        )

        cases = [[False, False], [False, True], [True, False]]

        for args in cases:
            toolbar = self.get_toolbar_for_page(page, superuser, *args)
            page_menu = toolbar.find_items(Menu, name="Page")[0].item

            # Check that the course item is absent
            results = page_menu.find_items(ModalItem, name="Course settings...")
            self.assertEqual(results, [])

            # Check that the snapshot item is absent
            results = page_menu.find_items(ModalItem, name="Snapshot this page...")
            self.assertEqual(results, [])

            # Check that the organization item is absent
            results = page_menu.find_items(ModalItem, name="Organization settings...")
            self.assertEqual(results, [])

            # Check that the person item is absent
            results = page_menu.find_items(ModalItem, name="Person settings...")
            self.assertEqual(results, [])

    @override_settings(CMS_PERMISSION=False)
    # pylint: disable=too-many-locals
    def test_cms_toolbars_person_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the person is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        person = PersonFactory()

        # Create different users for each possible level of access
        # pylint: disable=too-many-locals
        superuser = UserFactory(is_staff=True, is_superuser=True)
        staff_with_permission = UserFactory(is_staff=True)
        user_with_permission = UserFactory()
        staff = UserFactory(is_staff=True)
        user = UserFactory()
        anonymous = AnonymousUser()

        # Add global permission to change page for users concerned
        can_change_page = Permission.objects.get(codename="change_page")
        staff_with_permission.user_permissions.add(can_change_page)
        user_with_permission.user_permissions.add(can_change_page)

        cases = [
            ([superuser, False, False], self.check_disabled),
            ([superuser, True, False], self.check_active),
            ([superuser, False, True], self.check_disabled),
            ([staff_with_permission, False, False], self.check_disabled),
            ([staff_with_permission, True, False], self.check_active),
            ([staff_with_permission, False, True], self.check_disabled),
            ([staff, False, False], self.check_missing),
            ([staff, True, False], self.check_missing),
            ([staff, False, True], self.check_missing),
            ([user_with_permission, False, False], self.check_absent),
            ([user_with_permission, True, False], self.check_absent),
            ([user_with_permission, False, True], self.check_absent),
            ([user, False, False], self.check_absent),
            ([user, True, False], self.check_absent),
            ([user, False, True], self.check_absent),
            ([anonymous, False, False], self.check_absent),
            ([anonymous, True, False], self.check_absent),
            ([anonymous, False, True], self.check_absent),
        ]

        url = f"/en/admin/courses/person/{person.id:d}/change/"

        for args, method in cases:
            toolbar = self.get_toolbar_for_page(person.extended_object, *args)
            item = method(toolbar, "Person settings...")
            if item:
                self.assertEqual(item.url, url)
