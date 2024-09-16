"""
Declare and configure the models for the index part
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.extensions.extension_pool import extension_pool

from ...core.models import BasePageExtension
from .. import defaults


class IndexPage(BasePageExtension):
    """
    The IndexPage extension defines some options for a page entry in the main menu.
    """

    PAGE = defaults.INDEXES_PAGE

    class Meta:
        db_table = "richie_index"
        ordering = ["-pk"]
        verbose_name = _("index")
        verbose_name_plural = _("indexes")

    def __str__(self):
        """Human representation of an index page"""
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
        max_length=10,
        default="",
        blank=True,
        choices=defaults.INDEX_MENU_COLOR_CLASSES,
        help_text=_("A color used to display page in menu"),
    )


extension_pool.register(IndexPage)
