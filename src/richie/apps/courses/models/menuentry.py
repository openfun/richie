"""
Declare and configure the models for the menu entry part
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.extensions.extension_pool import extension_pool

from ...core.models import BasePageExtension
from .. import defaults


class MainMenuEntry(BasePageExtension):
    """
    The MainMenuEntry extension defines some options for a page entry in the main menu.
    """

    PAGE = defaults.MENUENTRIES_PAGE

    class Meta:
        db_table = "richie_menuentry"
        ordering = ["-pk"]
        verbose_name = _("main menu entry")
        verbose_name_plural = _("main menu entries")

    def __str__(self):
        """Human representation of an main menu entry page"""
        model = self._meta.verbose_name.title()
        name = self.extended_object.get_title()
        return f"{model:s}: {name:s}"

    allow_submenu = models.BooleanField(
        _("Allow submenu"),
        default=False,
        help_text=_(
            "If enabled the page entry in menu will be a dropdown for its possible "
            "children."
        ),
    )
    menu_color = models.CharField(
        _("Color in menu"),
        max_length=50,
        default="",
        blank=True,
        choices=defaults.MENU_ENTRY_COLOR_CLASSES,
        help_text=_("A color used to display page entry in menu."),
    )


extension_pool.register(MainMenuEntry)
