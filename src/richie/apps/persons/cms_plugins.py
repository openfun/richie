"""
Person CMS plugin
"""
from collections import defaultdict

from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from cms.utils import get_language_from_request

from .models import PersonPluginModel


class PageExtensionPluginMixin:
    """
    A mixin to insert the plugins of included in a page to another page's render context

    A plugin will represent a page in another page. The content rendered by the plugin is
    built with the content inserted in the placeholders of the original corresponding page.
    The idea is that other developers using our application to build their own project, should
    be able to customize the content of each page and plugin without having to modify models
    and database schemas.
    """

    def render(self, context, instance, current_placeholder):
        """
        This generic `render` method will add to the plugin template context
        a dictionnary of placeholders and plugins from page extension this plugin is representing.
        """
        context = super().render(context, instance, current_placeholder)
        language = get_language_from_request(context["request"])

        related_plugins = defaultdict(list)
        # Use "get_placeholders" to benefit from the cache mechanism
        for placeholder in instance.page.get_placeholders():
            if placeholder.slot == "maincontent":
                # We only build the plugin content with the specific placeholders
                continue

            for plugin in placeholder.get_plugins(language=language):
                plugin_model_instance = plugin.get_bound_plugin()
                related_plugins[placeholder.slot].append(plugin_model_instance)

        context.update({"page": instance.page, "related_plugins": related_plugins})
        return context


@plugin_pool.register_plugin
class PersonPlugin(PageExtensionPluginMixin, CMSPluginBase):
    """
    Person plugin displays a person's information on other pages
    """

    model = PersonPluginModel
    module = _("Persons")
    render_template = "persons/plugins/person.html"
    cache = True
