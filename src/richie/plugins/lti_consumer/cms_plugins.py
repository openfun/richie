"""
LTI consumer CMS plugin
"""
import json

from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .forms import LTIConsumerForm
from .models import LTIConsumer


@plugin_pool.register_plugin
class LTIConsumerPlugin(CMSPluginBase):
    """
    A plugin to consume LTI content.
    """

    allow_children = False
    cache = True
    disable_child_plugins = True
    form = LTIConsumerForm
    model = LTIConsumer
    module = PLUGINS_GROUP
    name = _("LTI consumer")
    render_template = "richie/lti_consumer/lti_consumer.html"

    class Media:
        """
        Simple UX improvement that hides useless fields if a predefined LTI provider is used
        """

        js = ("lti_consumer/js/change_form.js",)

    def render(self, context, instance, placeholder):
        """
        Build plugin context passed to its template to perform rendering
        and pass edit mode
        """
        edit = (
            "request" in context
            and context["request"].toolbar
            and context["request"].toolbar.edit_mode_active
        )

        context = super().render(context, instance, placeholder)
        context["widget_props"] = json.dumps(
            self.get_lti_consumer_widget_props(instance, edit=edit)
        )
        return context

    @staticmethod
    def get_lti_consumer_widget_props(instance, edit=False):
        """
        Return all LTI consumer properties required by LTIConsumer React widget
        """
        return {
            "url": instance.url,
            "content_parameters": instance.content_parameters(edit=edit),
            "automatic_resizing": instance.automatic_resizing,
        }
