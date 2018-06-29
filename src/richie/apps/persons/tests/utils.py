"""Test utils for the courses application"""

from django.contrib.auth.models import AnonymousUser, Permission
from django.core.exceptions import ImproperlyConfigured
from django.test.client import RequestFactory

from cms.middleware.toolbar import ToolbarMiddleware
from cms.toolbar.items import Menu, ModalItem

from richie.apps.core.factories import UserFactory


class CheckToolbarMixin:
    """
    Mixin that factorize `check_toolbar_item` method used by several applications
    CMS toolbar unit tests
    """

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
            toolbar = self.get_toolbar_for_page(page, *args)

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

    @staticmethod
    def get_toolbar_for_page(page, user, edit, preview):
        """
        This method is a helper to build a request to test the toolbar in different states
        for different users
        """
        url = page.get_absolute_url()
        factory = RequestFactory()

        if edit:
            url = "{:s}?edit".format(url)
        else:
            url = "{:s}?edit_off".format(url)

        if preview:
            url = "{:s}&preview".format(url)

        request = factory.get(url)
        request.user = user
        request.current_page = page
        request.session = {}

        middleware = ToolbarMiddleware()
        middleware.process_request(request)

        # pylint: disable=no-member
        request.toolbar.get_left_items()
        return request.toolbar
