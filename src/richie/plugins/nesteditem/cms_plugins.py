"""
NestedItem CMS plugin
"""

from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .defaults import NESTEDITEM_VARIANTS
from .models import NestedItem


@plugin_pool.register_plugin
class NestedItemPlugin(CMSPluginBase):
    """
    CMSPlugin to add a nested item with a variant form factor
    """

    cache = True
    model = NestedItem
    module = PLUGINS_GROUP
    name = _("Nested item")
    allow_children = True
    render_template = "richie/nesteditem/nesteditem.html"
    fieldsets = ((None, {"fields": ["variant", "content"]}),)

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "placeholder": placeholder,
                "nesting_level": context.get("nesting_level", 0),
                "parent_variant": context.get(
                    "parent_variant", NESTEDITEM_VARIANTS[0][0]
                ),
            }
        )
        return context
