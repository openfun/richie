"""Test utils for the courses application"""

from django.test.client import RequestFactory

from cms.middleware.toolbar import ToolbarMiddleware
from cms.toolbar.items import Menu, ModalItem


class CheckToolbarMixin:
    """
    Mixin that factorize `check_toolbar_item` method used by several applications
    CMS toolbar unit tests
    """

    def check_active(self, toolbar, name, item_type=ModalItem):
        """The item should be present in the toolbar and active."""
        page_menu_result = toolbar.find_items(Menu, name="Page")[0]
        results = page_menu_result.item.find_items(item_type, name=name)
        self.assertEqual(len(results), 1)
        item = results[0].item
        self.assertFalse(item.disabled)
        return item

    def check_disabled(self, toolbar, name, item_type=ModalItem):
        """The item should be present in the toolbar and disabled."""
        page_menu_result = toolbar.find_items(Menu, name="Page")[0]
        results = page_menu_result.item.find_items(item_type, name=name)
        self.assertEqual(len(results), 1)
        item = results[0].item
        self.assertTrue(item.disabled)
        return item

    def check_missing(self, toolbar, name, item_type=ModalItem):
        """The item should not be in the toolbar."""
        page_menu_result = toolbar.find_items(Menu, name="Page")[0]
        results = page_menu_result.item.find_items(item_type, name=name)
        self.assertEqual(results, [])

    # pylint: disable=unused-argument
    def check_absent(self, toolbar, *args, **kwargs):
        """The whole toolbar should be hidden."""
        self.assertEqual(toolbar.get_left_items(), [])

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
