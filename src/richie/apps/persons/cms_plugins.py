"""
Person CMS plugin
"""

from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .models import PersonPluginModel


@plugin_pool.register_plugin
class PersonPlugin(CMSPluginBase):
    """
    Person plugin displays a person's information on other pages
    """

    model = PersonPluginModel
    module = _("Persons")
    render_template = "persons/plugins/person.html"
    cache = True

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context
