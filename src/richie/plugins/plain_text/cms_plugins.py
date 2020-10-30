"""
Plain text CMS plugin
"""
from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.utils.translation import gettext_lazy as _

from cms.models import Placeholder
from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .models import PlainText


@plugin_pool.register_plugin
class PlainTextPlugin(CMSPluginBase):
    """
    A plugin to add plain text.
    """

    allow_children = False
    cache = True
    disable_child_plugins = True
    fieldsets = ((None, {"fields": ["body"]}),)
    model = PlainText
    module = PLUGINS_GROUP
    name = _("Plain text")
    render_template = "richie/plain_text/plain_text.html"

    def get_form(self, request, obj=None, change=False, **kwargs):
        """
        Add a max length validator based on what is configured in settings for the
        current placeholder.
        """
        form = super().get_form(request, obj=obj, change=change, **kwargs)

        placeholder_id = request.GET.get("placeholder_id")
        if not placeholder_id and not obj:
            return form

        if placeholder_id:
            placeholder = Placeholder.objects.only("slot").get(id=placeholder_id)
        else:
            placeholder = obj.placeholder

        max_length = getattr(settings, "RICHIE_PLAINTEXT_MAXLENGTH", {}).get(
            placeholder.slot
        )
        if max_length:
            form.base_fields["body"].validators.append(MaxLengthValidator(max_length))

        return form

    def render(self, context, instance, placeholder):
        """
        Build plugin context passed to its template to perform rendering
        """
        context = super().render(context, instance, placeholder)
        context["body"] = instance.body
        return context
