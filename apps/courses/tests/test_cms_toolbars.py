"""
Test suite of the toolbar extension for organization pages
"""
from django.contrib.auth.models import AnonymousUser, Permission
from django.core.exceptions import ImproperlyConfigured
from django.test.utils import override_settings

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.items import Menu, ModalItem

from apps.core.factories import UserFactory

from ..factories import CourseFactory, OrganizationFactory
from .utils import get_toolbar_for_page


class OrganizationCMSToolbarTestCase(CMSTestCase):
    """Testing the integration of organization page extensions in the toolbar"""

    def check_toolbar_item(self, page_extension, menu_item_text):
        """
        Not a test. This method is a helper to test the toolbar for the presence of a menu item
        for editing page extensions.
        """
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
            ([superuser, False, False], "disabled"),
            ([superuser, True, False], "active"),
            ([superuser, False, True], "disabled"),
            ([staff_with_permission, False, False], "disabled"),
            ([staff_with_permission, True, False], "active"),
            ([staff_with_permission, False, True], "disabled"),
            ([staff, False, False], "missing"),
            ([staff, True, False], "missing"),
            ([staff, False, True], "missing"),
            ([user_with_permission, False, False], "absent"),
            ([user_with_permission, True, False], "absent"),
            ([user_with_permission, False, True], "absent"),
            ([user, False, False], "absent"),
            ([user, True, False], "absent"),
            ([user, False, True], "absent"),
            ([anonymous, False, False], "absent"),
            ([anonymous, True, False], "absent"),
            ([anonymous, False, True], "absent"),
        ]
        admin_url = "/en/admin/{app_name:s}/{model_name:s}/{id:d}/change/".format(
            app_name=page_extension._meta.app_label,
            model_name=page_extension.__class__.__name__.lower(),
            id=page_extension.id,
        )

        page = page_extension.extended_object
        for args, state in cases:
            toolbar = get_toolbar_for_page(page, *args)

            if state in ["active", "disabled", "missing"]:
                page_menu_result = toolbar.find_items(Menu, name="Page")[0]
                results = page_menu_result.item.find_items(
                    ModalItem, name=menu_item_text
                )
                if state in ["active", "disabled"]:
                    self.assertEqual(len(results), 1)
                    item = results[0].item
                    self.assertEqual(item.url, admin_url)

                    if state == "active":
                        self.assertFalse(item.disabled)

                    elif state == "disabled":
                        self.assertTrue(item.disabled)

                elif state == "missing":
                    self.assertEqual(results, [])

                else:
                    raise ImproperlyConfigured()

            elif state == "absent":
                # The whole toolbar should be hidden
                self.assertEqual(toolbar.get_left_items(), [])

            else:
                raise ImproperlyConfigured()

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_course_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the course is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        course = CourseFactory()
        self.check_toolbar_item(course, "Course settings...")

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_organization_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the organization is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        organization = OrganizationFactory()
        self.check_toolbar_item(organization, "Organization settings...")

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_no_page_extension(self):
        """
        The toolbar should not include any item to edit a page extension on a page not related
        to any page extension.
        """
        # Testing with a superuser proves our point
        superuser = UserFactory(is_staff=True, is_superuser=True)

        # Create a page not related to any page extension
        page = create_page("A page", template="richie/fullwidth.html", language="en")

        cases = [[False, False], [False, True], [True, False]]

        for args in cases:
            toolbar = get_toolbar_for_page(page, superuser, *args)
            page_menu = toolbar.find_items(Menu, name="Page")[0].item

            # Check that the course item is absent
            results = page_menu.find_items(ModalItem, name="Course settings...")
            self.assertEqual(results, [])

            # Check that the organization item is absent
            results = page_menu.find_items(ModalItem, name="Organization settings...")
            self.assertEqual(results, [])
