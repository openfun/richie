"""
Notification CMS plugin
"""
from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .models import Notification


@plugin_pool.register_plugin
class NotificationPlugin(CMSPluginBase):
    """
    A plugin to add plain text.
    """

    allow_children = False
    cache = True
    disable_child_plugins = True
    fieldsets = ((None, {"fields": ["title", "message", "template"]}),)
    model = Notification
    module = PLUGINS_GROUP
    name = _("Notification")
    render_template = "richie/notification/notification.html"

    def render(self, context, instance, placeholder):
        """
        Build plugin context passed to its template to perform rendering
        """
        context = super().render(context, instance, placeholder)
        context.update({"instance": instance})
        return context
