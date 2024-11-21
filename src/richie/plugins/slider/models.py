"""
Slider plugin models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField


class Slider(CMSPlugin):
    """
    Slide container plugin for Slide item plugins.
    """

    title = models.CharField(_("title"), max_length=255)

    class Meta:
        verbose_name = _("Slider")
        verbose_name_plural = _("Sliders")

    def __str__(self):
        return self.title

    @property
    def front_identifier(self):
        """
        Return standardized identifier for the slider container.
        """
        return f"slider-{self.id}"

    @property
    def payload_identifier(self):
        """
        Return standardized identifier for the slider payload.
        """
        return f"{self.front_identifier}-data"

    def get_slider_payload(self):
        """
        Serializer a slider object and its slide items to Python object.

        Arguments:
            instance (richie.plugins.slider.models.SlideItem): Instance of a Slider
                object.

        Returns:
            dict: Dictionnary of slider data.
        """

        slides = self.child_plugin_instances or []

        return {
            "pk": self.id,
            "title": self.title,
            "slides": [
                {
                    "pk": plugin.id,
                    "title": plugin.title,
                    "image": plugin.image.url,
                    "content": plugin.content,
                    "link_url": plugin.link_url,
                    "link_open_blank": plugin.link_open_blank,
                }
                for plugin in slides
            ],
        }


class SlideItem(CMSPlugin):
    """
    Slide item plugin to include in a Slider plugin.
    """

    title = models.CharField(
        _("title"),
        max_length=150,
        default="",
    )
    image = FilerImageField(
        related_name="slide_image",
        verbose_name=_("image"),
        on_delete=models.SET_NULL,
        null=True,
        default=None,
    )
    content = models.TextField(
        _("content"),
        blank=True,
        default="",
    )
    link_url = models.URLField(
        verbose_name=_("link URL"),
        blank=True,
        null=True,
        max_length=255,
        help_text=_("Make the slide as a link with an URL."),
    )
    link_open_blank = models.BooleanField(
        _("open new window"),
        default=False,
        help_text=_("If checked the link will be open in a new window"),
    )

    class Meta:
        verbose_name = _("Slide item")
        verbose_name_plural = _("Slide items")

    def __str__(self):
        return self.title
