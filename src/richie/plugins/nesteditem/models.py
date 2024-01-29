"""
NestedItem plugin models
"""

from django.db import models
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _

from cms.models.pluginmodel import CMSPlugin

from .defaults import NESTEDITEM_VARIANTS


class NestedItem(CMSPlugin):
    """
    Nested item
    """

    content = models.TextField(_("Content"), blank=True, default="")
    variant = models.CharField(
        _("Variant"),
        max_length=50,
        choices=NESTEDITEM_VARIANTS,
        default=NESTEDITEM_VARIANTS[0][0],
        help_text=_("Form factor variant"),
    )

    def __str__(self):
        return Truncator(self.content).words(6, truncate="...")
