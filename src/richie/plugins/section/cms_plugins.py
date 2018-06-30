"""
Section CMS plugin
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import Section


@plugin_pool.register_plugin
class SectionPlugin(CMSPluginBase):
    """
    CMSPlugin to add a content section with a distinct title from content.
    """

    model = Section
    name = _("Section")
    render_template = "richie/section/section.html"
    cache = True
    module = settings.FUN_PLUGINS_GROUP
    allow_children = True

    fieldsets = ((None, {"fields": ["title"]}),)

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        return context
