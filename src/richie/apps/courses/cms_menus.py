"""
Menu modifier to add feature for menu template context.
"""

from django.conf import settings

from menus.base import Modifier
from menus.menu_pool import menu_pool

from .models import MainMenuEntry


class MenuWithMainMenuEntry(Modifier):
    """
    Menu modifier to include MainMenuEntry extension data in menu template context.

    In menu template you will be able to reach possible extension data from node
    attribute ``menu_extension``. If node page has no extension it will have an empty
    dict. Only a specific node level is processed and nodes with a different level
    won't have the attribute ``menu_extension`` at all.
    """

    # pylint: disable=too-many-arguments,too-many-positional-arguments
    def modify(self, request, nodes, namespace, root_id, post_cut, breadcrumb):
        """
        Patch navigation nodes to include data from possible extension
        ``MainMenuEntry``.

        For performance:

        * This does not work for breadcrumb navigation (all extension options are mean
          for menu only);
        * This works only on the menu top level, it means the one defined as first
          argument from tag ``{% show_menu .. %}``;

        Then to avoid making a query for each node item to retrieve its possible
        extension object, we get the extensions in bulk as values instead of objects.

        Finally we add the data on nodes so they can used from menu template.
        """
        # We are not altering breadcrumb menu, this is only for navigation menu and
        # only for the visible menu (not the whole processed tree)
        if not nodes or breadcrumb or not post_cut:
            return nodes

        # Get the page ids to process, only for the allowed node level
        page_ids = [
            node.id
            for node in nodes
            if node.level == settings.RICHIE_MAINMENUENTRY_MENU_ALLOWED_LEVEL
        ]

        # No need to continue if we don't have any valid node
        if not page_ids:
            return nodes

        # We directly get the extensions from their related page id and serialized
        # as a dict instead of model object
        extension_queryset = MainMenuEntry.objects.filter(
            extended_object_id__in=page_ids
        ).values("extended_object_id", "allow_submenu", "menu_color")

        # Pack extensions data into proper structure
        extension_datas = {
            item["extended_object_id"]: {
                "allow_submenu": item["allow_submenu"],
                "menu_color": item["menu_color"],
            }
            for item in extension_queryset
        }

        # Attach each possible extension data to its relative node
        for node in nodes:
            node.menu_extension = extension_datas.get(node.id, {})

        return nodes


menu_pool.register_modifier(MenuWithMainMenuEntry)
