"""
Toolbar extension for the search application
"""
from django.utils.translation import gettext_lazy as _

from cms.cms_toolbars import ADMIN_MENU_IDENTIFIER
from cms.toolbar_base import CMSToolbar
from cms.toolbar_pool import toolbar_pool
from rest_framework.reverse import reverse


@toolbar_pool.register
class SearchToolbar(CMSToolbar):
    """Customize the toolbar to add a button that regenerates the search index."""

    def populate(self):
        """
        Show an item in the toolbar only to users who have the permission to regenerate the
        search index.
        """

        if self.request.user.has_perm("search.can_manage_elasticsearch"):
            # Get the action endpoint for API version 1. We hardcode it as only this
            # piece of code will determine when to change the endpoint version.
            url = reverse("bootstrap_elasticsearch", kwargs={"version": "1.0"})
            admin_menu = self.toolbar.get_menu(ADMIN_MENU_IDENTIFIER)

            # Create the new menu item as an Ajax call
            admin_menu.add_ajax_item(
                _("Regenerate search index..."),
                action=url,
                data={},
                on_success=self.toolbar.REFRESH_PAGE,
                position=3,
            )
