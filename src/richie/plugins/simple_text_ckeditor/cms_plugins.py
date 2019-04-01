"""
Simple text CMS plugin
"""
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .forms import CKEditorPluginForm
from .models import SimpleText


@plugin_pool.register_plugin
class CKEditorPlugin(CMSPluginBase):
    """
    A plugin to add text with CKEditor widget.
    """

    model = SimpleText
    form = CKEditorPluginForm
    name = _("Simple text")
    render_template = "richie/simple_text_ckeditor/simple_text.html"
    cache = True
    module = settings.RICHIE_PLUGINS_GROUP
    allow_children = False
    disable_child_plugins = True

    fieldsets = ((None, {"fields": ["body"]}),)

    def render(self, context, instance, placeholder):
        """
        Build plugin context passed to its template to perform rendering
        """
        context = super(CKEditorPlugin, self).render(context, instance, placeholder)

        context.update({"instance": instance})

        return context
