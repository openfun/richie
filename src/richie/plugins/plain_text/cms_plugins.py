"""
Plain text CMS plugin
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import PlainText


@plugin_pool.register_plugin
class PlainTextPlugin(CMSPluginBase):
    """
    A plugin to add plain text.
    """

    allow_children = False
    cache = True
    disable_child_plugins = True
    fieldsets = ((None, {"fields": ["body"]}),)
    model = PlainText
    module = settings.RICHIE_PLUGINS_GROUP
    name = _("Plain text")
    render_template = "richie/plain_text/plain_text.html"

    def render(self, context, instance, placeholder):
        """
        Build plugin context passed to its template to perform rendering
        """
        context = super(PlainTextPlugin, self).render(context, instance, placeholder)
        context["body"] = instance.body
        return context
