"""
Large banner CMS plugin
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .defaults import LARGEBANNER_TEMPLATES
from .forms import LargeBannerForm
from .models import LargeBanner


@plugin_pool.register_plugin
class LargeBannerPlugin(CMSPluginBase):
    """
    CMSPlugin to customize a home page header.
    """

    module = settings.RICHIE_PLUGINS_GROUP
    name = _("Large Banner")
    model = LargeBanner
    form = LargeBannerForm
    cache = True
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
