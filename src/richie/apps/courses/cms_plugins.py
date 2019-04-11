"""
Courses CMS plugins
"""

from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP

from .forms import LicencePluginForm
from .models import (
    BlogPostPluginModel,
    CategoryPluginModel,
    CoursePluginModel,
    LicencePluginModel,
    OrganizationPluginModel,
    PersonPluginModel,
)


@plugin_pool.register_plugin
class OrganizationPlugin(CMSPluginBase):
    """
    Organization plugin displays an organization's information on other pages
    """

    cache = True
    model = OrganizationPluginModel
    module = PLUGINS_GROUP
    render_template = "courses/plugins/organization.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context


@plugin_pool.register_plugin
class CategoryPlugin(CMSPluginBase):
    """
    Category plugin displays a category's information on other pages
    """

    cache = True
    model = CategoryPluginModel
    module = PLUGINS_GROUP
    render_template = "courses/plugins/category_plugin.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context


@plugin_pool.register_plugin
class CoursePlugin(CMSPluginBase):
    """
    Course plugin displays a course's information on other pages
    """

    cache = True
    model = CoursePluginModel
    module = PLUGINS_GROUP
    render_template = "courses/plugins/course_plugin.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context


@plugin_pool.register_plugin
class PersonPlugin(CMSPluginBase):
    """
    Person plugin displays a person's information on other pages
    """

    cache = True
    model = PersonPluginModel
    module = PLUGINS_GROUP
    render_template = "courses/plugins/person.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context


@plugin_pool.register_plugin
class LicencePlugin(CMSPluginBase):
    """
    CMSPlugin to add a licence selected from available Licence objects and
    with an additional free text.
    """

    allow_children = False
    cache = True
    fieldsets = ((None, {"fields": ["licence", "description"]}),)
    form = LicencePluginForm
    model = LicencePluginModel
    module = PLUGINS_GROUP
    name = _("Licence")
    render_template = "courses/plugins/licence_plugin.html"

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        return context


@plugin_pool.register_plugin
class BlogPostPlugin(CMSPluginBase):
    """
    BlogPost plugin displays a Blog post overview on other pages
    """

    cache = True
    model = BlogPostPluginModel
    module = PLUGINS_GROUP
    render_template = "courses/plugins/blogpost.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context
