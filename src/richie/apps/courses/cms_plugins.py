"""
Organization CMS plugin
"""

from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import OrganizationPluginModel


@plugin_pool.register_plugin
class OrganizationPlugin(CMSPluginBase):
    """
    Organization plugin displays an organization's information on other pages
    """

    model = OrganizationPluginModel
    module = _("Courses")
    render_template = "courses/plugins/organization.html"
    cache = True

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        return context
