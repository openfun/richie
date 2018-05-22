"""
Test suite of the toolbar extension for person pages
"""
from django.test.utils import override_settings

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.items import Menu, ModalItem

from apps.core.factories import UserFactory

from ..factories import PersonFactory
from .utils import CheckToolbarMixin


# pylint: disable=too-many-ancestors
class PersonCMSToolbarTestCase(CheckToolbarMixin, CMSTestCase):
    """Testing the integration of person page extensions in the toolbar"""

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_person_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the person is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        person = PersonFactory()
        self.check_toolbar_item(person, "Person settings...")

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
            toolbar = self.get_toolbar_for_page(page, superuser, *args)
            page_menu = toolbar.find_items(Menu, name="Page")[0].item

            # Check that the person item is absent
            results = page_menu.find_items(ModalItem, name="Person settings...")
            self.assertEqual(results, [])
