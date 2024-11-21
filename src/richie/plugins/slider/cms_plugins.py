"""
Slider CMS plugins
"""

from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .forms import SlideItemForm, SliderForm
from .models import SlideItem, Slider


@plugin_pool.register_plugin
class SliderPlugin(CMSPluginBase):
    """
    CMSPlugin to hold Slide plugin items.
    """

    cache = True
    module = PLUGINS_GROUP
    name = _("Slider")
    model = Slider
    form = SliderForm
    render_template = "richie/slider/slider.html"
    allow_children = True
    child_classes = ["SlideItemPlugin"]
    fieldsets = ((None, {"fields": ["title"]}),)

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "placeholder": placeholder,
            }
        )
        return context


@plugin_pool.register_plugin
class SlideItemPlugin(CMSPluginBase):
    """
    CMSPlugin for slide item content.
    """

    cache = True
    module = PLUGINS_GROUP
    name = _("Slide item")
    model = SlideItem
    form = SlideItemForm
    render_template = "richie/slider/slide-item.html"
    require_parent = True
    parent_classes = ["SliderPlugin"]
    fieldsets = [
        (
            None,
            {
                "fields": (
                    "title",
                    "image",
                    "content",
                ),
            },
        ),
        (
            _("Link"),
            {
                "fields": (
                    "link_url",
                    "link_open_blank",
                ),
            },
        ),
    ]

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "placeholder": placeholder,
            }
        )
        return context
