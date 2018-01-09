
from django.utils.translation import ugettext_lazy as _
from django.conf import settings

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import UniversitiesList, AllUniversitiesList

@plugin_pool.register_plugin
class UniversitiesListPlugin(CMSPluginBase):
    """
    CMSPlugin to customize a list of universities with a limit
    """
    model = UniversitiesList
    name = _("Universities list Plugin")
    render_template = "universities_list.html"
    cache = False
    module = settings.FUN_PLUGINS_GROUP

    def render(self, context, instance, placeholder):
        context.update({
            'instance': instance,
            'placeholder': placeholder
        })
        return context

@plugin_pool.register_plugin
class AllUniversitiesListPlugin(CMSPluginBase):
    """
    CMSPlugin to customize a list of all universities
    """
    model = AllUniversitiesList
    name = _("All Universities list Plugin")
    render_template = "all_universities_list.html"
    cache = False
    module = settings.FUN_PLUGINS_GROUP

    def render(self, context, instance, placeholder):
        context.update({
            'instance': instance,
            'placeholder': placeholder
        })
        return context
