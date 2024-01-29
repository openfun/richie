"""Test utils for the courses application"""

import random
from functools import reduce

from django.http import HttpResponse
from django.test.client import RequestFactory

from cms.middleware.toolbar import ToolbarMiddleware
from cms.toolbar.items import ModalItem


class CheckToolbarMixin:
    """
    Mixin that factorize `check_toolbar_item` method used by several applications
    CMS toolbar unit tests
    """

    @staticmethod
    def _get_items(toolbar, name, item_type):
        """Get items matching a name and type throughout all menus of a toolbar."""
        return reduce(
            lambda acc, menu: acc + menu.find_items(item_type, name=name),
            toolbar.menus.values(),
            [],
        )

    def check_active(self, toolbar, name, item_type=ModalItem):
        """The item should be present in the toolbar and active."""
        results = self._get_items(toolbar, name, item_type)
        self.assertEqual(len(results), 1)
        item = results[0].item
        self.assertFalse(item.disabled)
        return item

    def check_disabled(self, toolbar, name, item_type=ModalItem):
        """The item should be present in the toolbar and disabled."""
        results = self._get_items(toolbar, name, item_type)
        self.assertEqual(len(results), 1)
        item = results[0].item
        self.assertTrue(item.disabled)
        return item

    def check_missing(self, toolbar, name, item_type=ModalItem):
        """The item should not be in the toolbar."""
        results = self._get_items(toolbar, name, item_type)
        self.assertEqual(results, [])

    # pylint: disable=unused-argument
    def check_absent(self, toolbar, *args, **kwargs):
        """The whole toolbar should be hidden."""
        self.assertEqual(toolbar.get_left_items(), [])

    @staticmethod
    def get_toolbar_for_page(page, user, edit=None, preview=None):
        """
        This method is a helper to build a request to test the toolbar in different states
        for different users
        """
        if edit is None:
            edit = random.choice([True, False])

        if preview is None:
            preview = random.choice([True, False])

        url = page.get_absolute_url()
        factory = RequestFactory()

        if edit:
            url = f"{url:s}?edit"
        else:
            url = f"{url:s}?edit_off"

        if preview:
            url = f"{url:s}&preview"

        request = factory.get(url)
        request.user = user
        request.current_page = page
        request.session = {}

        middleware = ToolbarMiddleware(get_response=lambda req: HttpResponse())
        middleware(request)

        # pylint: disable=no-member
        request.toolbar.get_left_items()
        return request.toolbar
