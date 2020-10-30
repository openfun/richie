"""
Large banner plugin models
"""
from django.db import models
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _

from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField

from .defaults import LARGEBANNER_TEMPLATES


# pylint: disable=model-no-explicit-unicode,line-too-long
#
# We choose to ignore the 'model-no-explicit-unicode' since we are running
# python 3, and pylint-django fails at detecting the python 2 compatibility
# layer [1] handled by Django CMS [2]. And we also ignore the 'line-too-long'
# warning caused by reference urls.
#
# [1] https://docs.djangoproject.com/en/1.11/ref/utils/#django.utils.encoding.python_2_unicode_compatible # noqa
# [2] https://github.com/divio/django-cms/blob/3.5.2/cms/models/pluginmodel.py#L171
class LargeBanner(CMSPlugin):
    """
    Model to configure a home page banner with background image, logo and title.
    """

    title = models.CharField(max_length=255)
    background_image = FilerImageField(
        related_name="background_image",
        verbose_name=_("background image"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    logo = FilerImageField(
        related_name="logo",
        verbose_name=_("logo"),
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    logo_alt_text = models.CharField(max_length=255, blank=True)
    template = models.CharField(
        _("Template"),
        max_length=150,
        choices=LARGEBANNER_TEMPLATES,
        default=LARGEBANNER_TEMPLATES[0][0],
        blank=False,
        help_text=_("Choose template to render plugin."),
    )
    content = models.TextField(_("Content"), blank=True, default="")

    def __str__(self):
        return Truncator(self.title).words(6, truncate="...")
