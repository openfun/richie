"""
LTI consumer CMS plugin
"""

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
    fieldsets = (
        (
            None,
            {
                "fields": [
                    "lti_provider_id",
                    "url",
                    "oauth_consumer_key",
                    "form_shared_secret",
                ]
            },
        ),
        (
            _("Advanced settings"),
            {
                "classes": ("collapse",),
                "fields": ["is_automatic_resizing", "inline_ratio"],
            },
        ),
    )
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
