"""
Section plugin models
"""

from django.db import models
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _

from cms.models.pluginmodel import CMSPlugin
from djangocms_attributes_field.fields import AttributesField

from .defaults import SECTION_TEMPLATES


class Section(CMSPlugin):
    """
    Section plugin model

    A Section aims to enforce a distinct title from its content

    It should be used as filling a title then adding sub content plugins.
    """

    title = models.CharField(max_length=255, blank=True, null=True)
    template = models.CharField(
        _("Template"),
        max_length=150,
        choices=SECTION_TEMPLATES,
        default=SECTION_TEMPLATES[0][0],
        help_text=_("Optional template for custom look."),
    )
    attributes = AttributesField(
        verbose_name=_("Attributes"),
        blank=True,
        excluded_keys=["href", "target"],
    )

    def __str__(self):
        return Truncator(self.title).words(6, truncate="...")
