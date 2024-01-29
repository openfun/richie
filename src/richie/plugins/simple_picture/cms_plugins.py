"""SimplePicture plugin for DjangoCMS."""

from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from djangocms_picture.models import Picture

from richie.apps.core.defaults import PLUGINS_GROUP

from .forms import SimplePictureForm
from .helpers import get_picture_info


@plugin_pool.register_plugin
class SimplePicturePlugin(CMSPluginBase):
    """
    CMSPlugin to easily add an image when all display options for the image are determined by
    code i.e via presets defined in the project settings or via rendering contexts in templates.
    """

    allow_children = False
    cache = True
    disable_child_plugins = True
    form = SimplePictureForm
    model = Picture
    module = PLUGINS_GROUP
    name = _("Image")
    render_template = "richie/simple_picture/picture.html"
    render_plugin = True

    fieldsets = ((None, {"fields": ["picture"]}),)

    def render(self, context, instance, placeholder):
        """
        Compute thumbnails and populate the context with all the information necessary to display
        the image as defined in settings.

        The image is chosen in the following order:
          - preset matching a name passed in the context via the `picture_preset` parameter,
          - preset matching the name of the placeholder in which the plugin is being used,
          - fallback to the `default` preset.
        """
        # Look for the name of a preset in the context and default to the name of the placeholder
        preset_name = context.get("picture_preset", placeholder)

        context["picture_info"] = get_picture_info(instance, preset_name)
        context["instance"] = instance
        return context
