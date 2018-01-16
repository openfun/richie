
from django.core.urlresolvers import NoReverseMatch
from django.utils.translation import (
    get_language_from_request,
    ugettext_lazy as _,
)

from cms.menu_bases import CMSAttachMenu
from cms.apphook_pool import apphook_pool
from menus.base import NavigationNode
from menus.menu_pool import menu_pool

from .models import Organization


class OrganizationMenu(CMSAttachMenu):
    """
    A menu to attached organizations to a page
    """

    name = _('Organization Menu')

    def get_queryset(self, request):
        """Returns a queryset with organization list"""
        return Organization.objects.all()

    def get_nodes(self, request):
        """
        Returns a Navigation node with organization absolute url.
        If there isn't a page with apphook defined, the absolute url
        of the organization is None
        """
        nodes = []
        organizations = self.get_queryset(request)

        for organization in organizations:
            try:
                url = organization.get_absolute_url()
            except NoReverseMatch:
                url = None

            if url:
                node = NavigationNode(organization.name, url, organization.pk)
                nodes.append(node)
        return nodes


menu_pool.register_menu(OrganizationMenu)
