"""
Glimpse CMS plugin
"""
from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .models import Glimpse


@plugin_pool.register_plugin
class GlimpsePlugin(CMSPluginBase):
    """
    CMSPlugin to add a glimpse with a variant form factor
    """

    cache = True
    model = Glimpse
    module = PLUGINS_GROUP
    name = _("Glimpse")
    render_template = "richie/glimpse/glimpse.html"
    fieldsets = (
        (None, {"fields": ["title", "variant", "image", "content"]}),
        (
            _("Link settings"),
            {"classes": ("collapse",), "fields": (("link_url", "link_page"),)},
        ),
    )

    # pylint: disable=R0201
    def compute_variant(self, context, instance):
        """
        Get the right final "variant" value for template context.

        * If model instance has an empty "variant" attribute, use the "glimpse_variant"
          value from parent template context, default to None if not set;
        * If model instance has a not null "variant" attribute use it, no
          matter what the value from parent template context is;
        """
        return instance.variant or context.get("glimpse_variant")

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "placeholder": placeholder,
                "glimpse_variant": self.compute_variant(context, instance),
            }
        )
        return context
