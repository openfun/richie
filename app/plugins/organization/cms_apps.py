from cms.app_base import CMSApp
from cms.apphook_pool import apphook_pool

from django.db import models
from djangocms_text_ckeditor.fields import HTMLField
from django.utils.translation import ugettext_lazy as _

@apphook_pool.register
class UniversityApp(CMSApp):
    name = _("Organization App")
    urls = ['plugins.organization.urls']

    def get_urls(self, page=None, language=None, **kwargs):
        return self.urls