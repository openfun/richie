"""
Courses CMS plugins
"""

from django.utils.translation import gettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from richie.apps.core.defaults import PLUGINS_GROUP
from richie.apps.core.models import get_relevant_page_with_fallbacks

from . import forms, models


@plugin_pool.register_plugin
class OrganizationPlugin(CMSPluginBase):
    """
    Organization plugin displays an organization's information on other pages
    """

    cache = True
    fieldsets = ((None, {"fields": ["page", "variant"]}),)
    form = forms.OrganizationPluginForm
    model = models.OrganizationPluginModel
    module = PLUGINS_GROUP
    name = _("Organization")
    render_template = "courses/plugins/organization.html"

    def render(self, context, instance, placeholder):
        """Populate and return the context for rendering."""
        target_page = get_relevant_page_with_fallbacks(context, instance)
        context.update(
            {
                "instance": instance,
                "target_page": target_page,
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
    form = forms.OrganizationsByCategoryPluginForm
    model = models.OrganizationsByCategoryPluginModel
    module = PLUGINS_GROUP
    name = _("Organization by Category")
    render_template = "courses/plugins/organizations_by_category.html"

    def render(self, context, instance, placeholder):
        """
        Add to context a query of all the organizations linked to the target category or one of
        its descendants via a category plugin on the organization detail page.
        """
        target_page = get_relevant_page_with_fallbacks(context, instance)
        organizations = target_page.category.get_organizations() if target_page else []
        context.update(
            {
                "instance": instance,
                "organizations": organizations,
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
    form = forms.CategoryPluginForm
    model = models.CategoryPluginModel
    module = PLUGINS_GROUP
    name = _("Category")
    render_template = "courses/plugins/category_plugin.html"

    def render(self, context, instance, placeholder):
        """Populate and return the context for rendering."""
        target_page = get_relevant_page_with_fallbacks(context, instance)
        context.update(
            {
                "category_variant": instance.variant or context.get("category_variant"),
                "instance": instance,
                "placeholder": placeholder,
                "target_page": target_page,
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
    form = forms.CoursePluginForm
    model = models.CoursePluginModel
    module = PLUGINS_GROUP
    name = _("Course")
    render_template = "courses/plugins/course_plugin.html"

    def render(self, context, instance, placeholder):
        """Populate and return the context for rendering."""
        target_page = get_relevant_page_with_fallbacks(context, instance)
        context.update(
            {
                "instance": instance,
                "course_variant": instance.variant or context.get("course_variant"),
                "placeholder": placeholder,
                "target_page": target_page,
            }
        )
        return context


@plugin_pool.register_plugin
class PersonPlugin(CMSPluginBase):
    """
    Person plugin displays a person's information on other pages
    """

    cache = True
    form = forms.PersonPluginForm
    model = models.PersonPluginModel
    module = PLUGINS_GROUP
    name = _("Person")
    render_template = "courses/plugins/person.html"

    def render(self, context, instance, placeholder):
        """Populate and return the context for rendering."""
        target_page = get_relevant_page_with_fallbacks(context, instance)
        context.update(
            {
                "instance": instance,
                "placeholder": placeholder,
                "target_page": target_page,
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
    form = forms.LicencePluginForm
    model = models.LicencePluginModel
    module = PLUGINS_GROUP
    name = _("Licence")
    render_template = "courses/plugins/licence_plugin.html"

    def render(self, context, instance, placeholder):
        """Populate and return the context for rendering."""
        context.update({"instance": instance, "placeholder": placeholder})
        return context


@plugin_pool.register_plugin
class BlogPostPlugin(CMSPluginBase):
    """
    BlogPost plugin displays a Blog post overview on other pages
    """

    cache = True
    fieldsets = ((None, {"fields": ["page", "variant"]}),)
    form = forms.BlogPostPluginForm
    model = models.BlogPostPluginModel
    module = PLUGINS_GROUP
    name = _("Post")
    render_template = "courses/plugins/blogpost.html"

    def render(self, context, instance, placeholder):
        """Populate and return the context for rendering."""
        target_page = get_relevant_page_with_fallbacks(context, instance)
        context.update(
            {
                "blogpost_variant": instance.variant or context.get("blogpost_variant"),
                "instance": instance,
                "placeholder": placeholder,
                "target_page": target_page,
            }
        )
        return context


@plugin_pool.register_plugin
class ProgramPlugin(CMSPluginBase):
    """
    Program plugin displays a course's information on other pages
    """

    cache = True
    form = forms.ProgramPluginForm
    model = models.ProgramPluginModel
    module = PLUGINS_GROUP
    name = _("Program")
    render_template = "courses/plugins/program.html"

    def render(self, context, instance, placeholder):
        """Populate and return the context for rendering."""
        target_page = get_relevant_page_with_fallbacks(context, instance)
        context.update(
            {
                "instance": instance,
                "placeholder": placeholder,
                "target_page": target_page,
            }
        )
        return context
