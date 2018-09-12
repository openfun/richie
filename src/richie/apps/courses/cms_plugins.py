"""
Courses CMS plugins
"""

from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .forms import LicencePluginForm
from .models import LicencePluginModel, OrganizationPluginModel


@plugin_pool.register_plugin
class OrganizationPlugin(CMSPluginBase):
    """
    Organization plugin displays an organization's information on other pages
    """

    model = OrganizationPluginModel
    module = _("Courses")
    render_template = "courses/plugins/organization_plugin.html"
    cache = True
    module = settings.FUN_PLUGINS_GROUP

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        return context


@plugin_pool.register_plugin
class LicencePlugin(CMSPluginBase):
    """
    CMSPlugin to add a licence selected from available Licence objects and
    with an additional free text.
    """

    model = LicencePluginModel
    form = LicencePluginForm
    name = _("Licence")
    render_template = "courses/plugins/licence_plugin.html"
    cache = True
    module = settings.FUN_PLUGINS_GROUP
    allow_children = False

    fieldsets = ((None, {"fields": ["licence", "description"]}),)

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        return context
