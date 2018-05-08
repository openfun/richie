"""
Toolbar extension for organizations
"""
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

from cms.api import get_page_draft
from cms.extensions.toolbar import ExtensionToolbar
from cms.toolbar_pool import toolbar_pool
from cms.utils.page_permissions import user_can_change_page

from .models import Organization


@toolbar_pool.register
class OrganizationToolbar(ExtensionToolbar):
    """
    This extension class customizes the toolbar for organizations
    """

    def populate(self):
        """
        When visiting a page that is linked to an organization page extension, show an item
        `Organization settings` in the toolbar only to users who have the permission to update
        the page.

        Clicking on this menu item will open the admin page of the organization page extension.
        """
        # always use draft if we have a page
        self.page = get_page_draft(self.request.current_page)
        if not self.page:
            # Nothing to do
            return

        if user_can_change_page(user=self.request.user, page=self.page):
            try:
                organization = Organization.objects.get(extended_object_id=self.page.id)
            except Organization.DoesNotExist:
                return

            url = reverse(
                "admin:organizations_organization_change", args=(organization.pk,)
            )
            edit_mode_inactive = not self.toolbar.edit_mode_active
            current_page_menu = self.toolbar.get_or_create_menu("page")
            current_page_menu.add_modal_item(
                _("Organization settings"),
                url=url,
                disabled=edit_mode_inactive,
                position=4,
            )
