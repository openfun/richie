from django.utils.translation import ugettext as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import FeaturedOrganizations, OrganizationPage


@plugin_pool.register_plugin
class FeaturedOrganizationPlugin(CMSPluginBase):
    model = FeaturedOrganizations
    module = _("Organizations")
    name = _("Featured Organizations Plugin")
    render_template = "organizations/plugins/featured_organizations.html"

    def render(self, context, instance, placeholder):
        organization_pages = OrganizationPage.objects.all()
        featured_organizations = [page.get_data() for page in organization_pages]
        context.update({'featured_organizations': featured_organizations})
        return context
