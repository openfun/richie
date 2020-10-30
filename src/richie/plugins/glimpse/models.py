"""
Glimpse plugin models
"""
from django.db import models
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _

from cms.models.fields import PageField
from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField

from .defaults import GLIMPSE_VARIANTS


class Glimpse(CMSPlugin):
    """
    Glimpse plugin model
    """

    title = models.CharField(max_length=255, blank=True, null=True)
    variant = models.CharField(
        _("Variant"),
        max_length=50,
        choices=GLIMPSE_VARIANTS,
        default=GLIMPSE_VARIANTS[0][0],
        blank=True,
        null=True,
        help_text=_("Form factor variant"),
    )
    image = FilerImageField(
        related_name="image",
        verbose_name=_("image"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    content = models.TextField(_("Content"), null=True, blank=True, default="")
    link_url = models.URLField(
        verbose_name=_("External URL"),
        blank=True,
        null=True,
        max_length=255,
        help_text=_("Make the glimpse as a link with an external URL."),
    )
    link_page = PageField(
        verbose_name=_("Internal URL"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        help_text=_("Make the glimpse as a link with an internal (page) URL."),
    )

    def __str__(self):
        return Truncator(self.title).words(6, truncate="...")

    def get_link(self):
        """
        Return attached link if any.

        In case the "link_url" and "link_page" fields are both not empty,
        "link_url" is always used.
        """
        link = None

        if self.link_url:
            link = self.link_url
        elif self.link_page_id:
            # pylint: disable=E1101
            link = self.link_page.get_absolute_url(language=self.language)

        return link

    def is_blank_target(self):
        """
        Return if the possible link is to be open in a blank target
        (new window/tab) or not.

        Blank target is only true if object has a value for "link_url"
        attribute.
        """
        return bool(self.link_url)
