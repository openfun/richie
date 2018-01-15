
from __future__ import unicode_literals

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
    name = _('Organization Menu')

    def get_queryset(self, request):
        """Returns base queryset with support for preview-mode."""
        queryset = Organization.objects.all()
        return queryset

    def get_nodes(self, request):
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
