"""
NestedItem plugin models
"""
from django.db import models
from django.utils.text import Truncator
from django.utils.translation import ugettext_lazy as _

from cms.models.pluginmodel import CMSPlugin

from .defaults import NESTEDITEM_VARIANTS


class NestedItem(CMSPlugin):
    """
    Nested item
    """

    variant = models.CharField(
        _("Variant"),
        max_length=50,
        choices=NESTEDITEM_VARIANTS,
        default=NESTEDITEM_VARIANTS[0][0],
        blank=True,
        null=True,
        help_text=_("Form factor variant"),
    )
    content = models.TextField(_("Content"), blank=False, default="")

    def __str__(self):
        return Truncator(self.content).words(6, truncate="...")
