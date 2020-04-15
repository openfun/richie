"""
NestedItem CMS plugin
"""
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .models import NestedItem


@plugin_pool.register_plugin
class NestedItemPlugin(CMSPluginBase):
    """
    CMSPlugin to add a nesteditem with a variant form factor
    """

    cache = True
    model = NestedItem
    module = PLUGINS_GROUP
    name = _("Nested item")
    allow_children = True
    render_template = "richie/nesteditem/nesteditem.html"
    fieldsets = ((None, {"fields": ["variant", "content"]}),)

    # pylint: disable=R0201
    def compute_variant(self, context, instance):
        """
        Get the right final "variant" value for template context.

        * If model instance has an empty "variant" attribute, use the "nesteditem_variant"
          value from parent template context, default to None if not set;
        * If model instance has a not null "variant" attribute use it, no
          matter what the value from parent template context is;
        """
        return instance.variant or context.get("nesteditem_variant")

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "placeholder": placeholder,
                "nesteditem_variant": self.compute_variant(context, instance),
            }
        )
        return context
