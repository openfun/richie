"""
Section CMS plugin
"""
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .defaults import SECTION_TEMPLATES
from .models import Section


@plugin_pool.register_plugin
class SectionPlugin(CMSPluginBase):
    """
    CMSPlugin to add a content section with a distinct title from content.
    """

    allow_children = True
    cache = True
    fieldsets = ((None, {"fields": ["title", "template"]}),)
    model = Section
    module = PLUGINS_GROUP
    name = _("Section")
    # Required from CMSPluginBase signature but not used since we override it
    # from render()
    render_template = SECTION_TEMPLATES[0][0]

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        self.render_template = instance.template
        return context
