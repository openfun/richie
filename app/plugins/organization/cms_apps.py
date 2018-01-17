from cms.app_base import CMSApp
from cms.apphook_pool import apphook_pool

from django.utils.translation import ugettext_lazy as _

@apphook_pool.register
class OrganizationApp(CMSApp):
    """
    An apphook to defined organizations urls from
    an attached page
    """
    name = _("Organization App")
    app_name = "OrganizationApp"
    urls = ['plugins.organization.urls']

    def get_urls(self, page=None, language=None, **kwargs):
        """
        Returns all organizations urls defined
        """
        return self.urls
