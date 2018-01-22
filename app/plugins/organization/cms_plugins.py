
from django.utils.translation import ugettext_lazy as _
from django.conf import settings

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import OrganizationList

@plugin_pool.register_plugin
class OrganizationListPlugin(CMSPluginBase):
    """
    CMSPlugin to customize a list of Organization with a limit
    """
    model = OrganizationList
    name = _("Organization list")
    render_template = "list_limit.html"
    cache = False
    module = settings.FUN_PLUGINS_GROUP

    def render(self, context, instance, placeholder):
        context.update({
            'instance': instance,
            'placeholder': placeholder
        })
        return context
