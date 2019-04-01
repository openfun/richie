"""
Courses CMS plugins
"""

from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

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

    model = OrganizationPluginModel
    module = _("Courses")
    render_template = "courses/plugins/organization.html"
    cache = True
    module = settings.RICHIE_PLUGINS_GROUP

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

    model = CategoryPluginModel
    module = _("Courses")
    render_template = "courses/plugins/category_plugin.html"
    cache = True
    module = settings.RICHIE_PLUGINS_GROUP

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

    model = CoursePluginModel
    module = _("Courses")
    render_template = "courses/plugins/course_plugin.html"
    cache = True
    module = settings.RICHIE_PLUGINS_GROUP

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

    model = PersonPluginModel
    module = _("Persons")
    render_template = "courses/plugins/person.html"
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


@plugin_pool.register_plugin
class LicencePlugin(CMSPluginBase):
    """
    CMSPlugin to add a licence selected from available Licence objects and
    with an additional free text.
    """

    model = LicencePluginModel
    form = LicencePluginForm
    name = _("Licence")
    render_template = "courses/plugins/licence_plugin.html"
    cache = True
    module = settings.RICHIE_PLUGINS_GROUP
    allow_children = False

    fieldsets = ((None, {"fields": ["licence", "description"]}),)

    def render(self, context, instance, placeholder):
        context.update({"instance": instance, "placeholder": placeholder})
        return context


@plugin_pool.register_plugin
class BlogPostPlugin(CMSPluginBase):
    """
    BlogPost plugin displays a Blog post overview on other pages
    """

    model = BlogPostPluginModel
    module = _("Courses")
    render_template = "courses/plugins/blogpost.html"
    cache = True
    module = settings.RICHIE_PLUGINS_GROUP

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context
