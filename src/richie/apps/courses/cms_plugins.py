"""
Courses CMS plugins
"""

from django.utils.translation import gettext_lazy as _

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
    OrganizationsByCategoryPluginModel,
    PersonPluginModel,
    ProgramPluginModel,
)


@plugin_pool.register_plugin
class OrganizationPlugin(CMSPluginBase):
    """
    Organization plugin displays an organization's information on other pages
    """

    cache = True
    fieldsets = ((None, {"fields": ["page", "variant"]}),)
    model = OrganizationPluginModel
    module = PLUGINS_GROUP
    name = _("Organization")
    render_template = "courses/plugins/organization.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
                "organization_variant": instance.variant
                or context.get("organization_variant"),
            }
        )
        return context


@plugin_pool.register_plugin
class OrganizationsByCategoryPlugin(CMSPluginBase):
    """
    Display a list of organization glimpses for all organizations related to the targeted category.
    """

    cache = True
    model = OrganizationsByCategoryPluginModel
    module = PLUGINS_GROUP
    name = _("Organization by Category")
    render_template = "courses/plugins/organizations_by_category.html"

    def render(self, context, instance, placeholder):
        """
        Add to context a query of all the organizations linked to the target category or one of
        its descendants via a category plugin on the organization detail page.
        """
        context.update(
            {
                "instance": instance,
                "organizations": instance.relevant_page.category.get_organizations(),
                "organization_variant": instance.variant
                or context.get("organization_variant"),
            }
        )
        return context


@plugin_pool.register_plugin
class CategoryPlugin(CMSPluginBase):
    """
    Category plugin displays a category's information on other pages
    """

    cache = True
    fieldsets = ((None, {"fields": ["page", "variant"]}),)
    model = CategoryPluginModel
    module = PLUGINS_GROUP
    name = _("Category")
    render_template = "courses/plugins/category_plugin.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
                "category_variant": instance.variant or context.get("category_variant"),
            }
        )

        return context


@plugin_pool.register_plugin
class CoursePlugin(CMSPluginBase):
    """
    Course plugin displays a course's information on other pages
    """

    cache = True
    fieldsets = ((None, {"fields": ["page", "variant"]}),)
    model = CoursePluginModel
    module = PLUGINS_GROUP
    name = _("Course")
    render_template = "courses/plugins/course_plugin.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
                "course_variant": instance.variant or context.get("course_variant"),
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
    name = _("Person")
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
    fieldsets = ((None, {"fields": ["page", "variant"]}),)
    model = BlogPostPluginModel
    module = PLUGINS_GROUP
    name = _("Post")
    render_template = "courses/plugins/blogpost.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
                "blogpost_variant": instance.variant or context.get("blogpost_variant"),
            }
        )
        return context


@plugin_pool.register_plugin
class ProgramPlugin(CMSPluginBase):
    """
    Program plugin displays a course's information on other pages
    """

    cache = True
    model = ProgramPluginModel
    module = PLUGINS_GROUP
    name = _("Program")
    render_template = "courses/plugins/program.html"

    def render(self, context, instance, placeholder):
        context.update(
            {
                "instance": instance,
                "relevant_page": instance.relevant_page,
                "placeholder": placeholder,
            }
        )
        return context
