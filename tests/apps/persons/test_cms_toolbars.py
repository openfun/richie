"""
Test suite of the toolbar extension for person pages
"""
from django.contrib.auth.models import AnonymousUser, Permission
from django.test.utils import override_settings

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.items import Menu, ModalItem

from richie.apps.core.factories import UserFactory
from richie.apps.persons.factories import PersonFactory
from richie.apps.persons.tests.utils import CheckToolbarMixin


# pylint: disable=too-many-ancestors
class PersonCMSToolbarTestCase(CheckToolbarMixin, CMSTestCase):
    """Testing the integration of person page extensions in the toolbar"""

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

        url = "/en/admin/persons/person/{id:d}/change/".format(id=person.id)

        for args, method in cases:
            toolbar = self.get_toolbar_for_page(person.extended_object, *args)
            item = method(toolbar, "Person settings...")
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
        page = create_page("A page", template="richie/fullwidth.html", language="en")

        cases = [[False, False], [False, True], [True, False]]

        for args in cases:
            toolbar = self.get_toolbar_for_page(page, superuser, *args)
            page_menu = toolbar.find_items(Menu, name="Page")[0].item

            # Check that the person item is absent
            results = page_menu.find_items(ModalItem, name="Person settings...")
            self.assertEqual(results, [])
