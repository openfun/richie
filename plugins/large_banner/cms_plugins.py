"""
Large banner CMS plugin
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import LargeBanner


@plugin_pool.register_plugin
class LargeBannerPlugin(CMSPluginBase):
    """
    CMSPlugin to customize a home page header.
    """

    model = LargeBanner
    name = _("Large Banner")
    render_template = "large_banner.html"
    cache = True
    module = settings.FUN_PLUGINS_GROUP

    fieldsets = (
        (None, {"fields": ["title", "background_image", "logo", "logo_alt_text"]}),
    )

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        return context
