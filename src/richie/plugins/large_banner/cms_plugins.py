"""
Large banner CMS plugin
"""

from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .defaults import LARGEBANNER_TEMPLATES
from .forms import LargeBannerForm
from .models import LargeBanner


@plugin_pool.register_plugin
class LargeBannerPlugin(CMSPluginBase):
    """
    CMSPlugin to customize a home page header.
    """

    cache = True
    form = LargeBannerForm
    model = LargeBanner
    module = PLUGINS_GROUP
    name = _("Large Banner")
    # Required from CMSPluginBase signature but not used since we override it
    # from render()
    render_template = LARGEBANNER_TEMPLATES[0][0]

    fieldsets = (
        (None, {"fields": ["title", "template"]}),
        (None, {"fields": ["content"]}),
        (_("Medias"), {"fields": ["background_image", "logo", "logo_alt_text"]}),
    )

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        self.render_template = instance.template
        return context
