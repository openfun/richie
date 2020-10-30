"""
Simple text CMS plugin
"""
from django.utils.translation import gettext_lazy as _

from cms.models import Placeholder
from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from djangocms_text_ckeditor.widgets import TextEditorWidget

from richie.apps.core.defaults import PLUGINS_GROUP

from .defaults import SIMPLETEXT_CONFIGURATION
from .forms import CKEditorPluginForm
from .models import SimpleText
from .validators import HTMLMaxLengthValidator


@plugin_pool.register_plugin
class CKEditorPlugin(CMSPluginBase):
    """
    A plugin to add text with CKEditor widget.
    """

    allow_children = False
    cache = True
    disable_child_plugins = True
    form = CKEditorPluginForm
    model = SimpleText
    module = PLUGINS_GROUP
    name = _("Simple text")
    render_template = "richie/simple_text_ckeditor/simple_text.html"

    fieldsets = ((None, {"fields": ["body"]}),)

    def get_form(self, request, obj=None, change=False, **kwargs):
        """
        Add an HTML max length validator and/or a CKEditor configuration based on what is
        configured in settings for the current placeholder.
        """
        form = super().get_form(request, obj=obj, change=change, **kwargs)

        placeholder_id = request.GET.get("placeholder_id")
        if not placeholder_id and not obj:
            return form

        if placeholder_id:
            placeholder = Placeholder.objects.only("slot").get(id=placeholder_id)
        else:
            placeholder = obj.placeholder

        for configuration in SIMPLETEXT_CONFIGURATION:
            if (
                "placeholders" not in configuration
                or placeholder.slot in configuration["placeholders"]
            ):
                break
        else:
            configuration = {}

        body_field = form.base_fields["body"]
        if configuration.get("max_length"):
            body_field.validators.append(
                HTMLMaxLengthValidator(configuration["max_length"])
            )

        if configuration.get("ckeditor"):
            body_field.widget = TextEditorWidget(
                configuration=configuration["ckeditor"]
            )

        return form

    def render(self, context, instance, placeholder):
        """
        Build plugin context passed to its template to perform rendering
        """
        context = super().render(context, instance, placeholder)
        context.update({"instance": instance})
        return context
