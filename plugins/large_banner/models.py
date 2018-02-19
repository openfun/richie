"""
Large banner plugin models
"""
from cms.models.pluginmodel import CMSPlugin
from django.db import models
from django.utils.translation import ugettext_lazy as _
from filer.fields.image import FilerImageField


class LargeBanner(CMSPlugin):
    """
    Model to configure a home page banner with background image, logo and title.
    """
    title = models.CharField(max_length=255)
    background_image = FilerImageField(
        related_name="background_image",
        verbose_name=_("background image"),
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    logo = FilerImageField(
        related_name="logo",
        verbose_name=_("logo"),
        on_delete=models.PROTECT,
    )
    logo_alt_text = models.CharField(
        _("logo alt text"),
        max_length=255,
        null=True, blank=True)
