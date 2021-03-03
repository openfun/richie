"""Custom template tags for the courses application of Richie."""
import json

from django import template
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import get_language
from django.utils.translation import gettext as _
from django.utils.translation import to_locale

import arrow
from classytags.arguments import Argument, MultiValueArgument
from classytags.core import Options, Tag
from classytags.utils import flatten_context
from cms.templatetags.cms_tags import (
    Placeholder,
    PlaceholderOptions,
    _get_page_by_untyped_arg,
)
from cms.toolbar.utils import get_toolbar_from_request
from cms.utils import get_site_id
from cms.utils.plugins import get_plugins

from ..lms import LMSHandler

# pylint: disable=invalid-name
register = template.Library()


def get_plugins_render_tag(context, name, varname, nodelist, page_lookup=None):
    """
    Retrieve the placeholder's plugins and set them as a variable in the template context.
    If the placeholder is empty, render the block as fallback content and return the
    resulting HTML.
    If the placeholder is editable and rendered on its own page, the edit script and markup
    are added to the HTML content.
    """
    content = ""
    request = context.get("request")

    if request:

        context[varname] = []
        page = _get_page_by_untyped_arg(page_lookup, request, get_site_id(None))

        if not page:
            return ""

        try:
            placeholder = page.placeholders.get(slot=name)
        except ObjectDoesNotExist:
            return ""
        else:
            context[varname] = [
                cms_plugin.get_plugin_instance()[0]
                for cms_plugin in get_plugins(
                    request, placeholder, template=page.get_template()
                )
            ]

        # Default content if there is no plugins in the placeholder
        if not context[varname] and nodelist:
            content = nodelist.render(context)

        # Add the edit script and markup to the content, only if the placeholder is editable
        # and the visited page is the one on which the placeholder is declared.
        toolbar = get_toolbar_from_request(request)
        if placeholder.page == request.current_page and toolbar.edit_mode_active:
            renderer = toolbar.get_content_renderer()
            data = renderer.get_editable_placeholder_context(placeholder, page=page)
            data["content"] = content
            content = renderer.placeholder_edit_template.format(**data)

    return content


@register.tag("get_placeholder_plugins")
class GetPlaceholderPlugins(Placeholder):
    """
    A template tag that declares a placeholder and sets its plugins as a context variable
    instead of rendering them eg:

        {% get_placeholder_plugins "logo" as varname %}
        {% get_placeholder_plugins "logo" as varname or %}
            <div>No content</div>
        {% endget_placeholder_plugins %}

    This tag can typically be used in association with the block_plugin tag, to customize the
    way it is rendered eg:

        {% get_placeholder_plugins "logo" as plugins %}
        {% blockplugin plugins.0 %}
            <img src="{% thumbnail instance.picture 300x150 %}"/>
        {% endblockplugin %}

    Keyword arguments:
        name: the name of the placeholder
        varname: context variable name. Output will be added to template context as this variable
            instead of being returned.
        or: optional argument which if given will make the template tag a block
            tag whose content is shown if the placeholder is empty

    Note: We must derive from the Placeholder class so that the tag is recognized as a
          placeholder and shown in the structure toolbar.
    """

    name = "get_placeholder_plugins"
    options = PlaceholderOptions(
        Argument("name", resolve=False),
        "as",
        Argument("varname", resolve=False),
        MultiValueArgument("extra_bits", required=False, resolve=False),
        blocks=[("endget_placeholder_plugins", "nodelist")],
    )

    # pylint: disable=arguments-differ,too-many-arguments
    def render_tag(self, context, name, varname, extra_bits, nodelist=None):
        return get_plugins_render_tag(context, name, varname, nodelist)


@register.tag("get_page_plugins")
class GetPagePlugins(Tag):
    """
    A template tag that gets plugins from a page's placeholder returns them as a context variable:

        {% get_page_plugins "logo" page_lookup as varname %}
        {% get_page_plugins "logo" page_lookup as varname or %}
            <div>No content</div>
        {% endget_page_plugins %}

    This tag can typically be used in association with the block_plugin tag,
    to render the retrieved plugins:

        {% get_page_plugins "logo" page_lookup as plugins %}
        {% blockplugin plugins.0 %}
            <img src="{% thumbnail instance.picture 300x150 %}"/>
        {% endblockplugin %}

    Keyword arguments:
        name: the name of the placeholder
        page_lookup: lookup argument for Page. See `_get_page_by_untyped_arg()`
            for detailed information on the allowed types and their interpretation for the
            `page_lookup` argument.
        varname: context variable name. Output will be added to template context as this variable
            instead of being returned.
        or: optional argument which if given will make the template tag a block
            tag whose content is shown if the placeholder is empty
    """

    name = "get_page_plugins"
    options = PlaceholderOptions(
        Argument("name", resolve=False),
        Argument("page_lookup"),
        "as",
        Argument("varname", resolve=False),
        MultiValueArgument("extra_bits", required=False, resolve=False),
        blocks=[("endget_page_plugins", "nodelist")],
    )

    # pylint: disable=arguments-differ,too-many-arguments, unused-argument
    def render_tag(
        self, context, name, page_lookup, varname, extra_bits, nodelist=None
    ):
        return get_plugins_render_tag(context, name, varname, nodelist, page_lookup)


@register.tag()
class BlockPlugin(Tag):
    """
    Like DjangoCMS 'render_plugin_block' but only includes the edit script and markup when
    the related placeholder is editable.

    This issue was raised to DjangoCMS and we need our own template tag until they find a way
    to fix it in DjangoCMS (https://github.com/divio/django-cms/issues/6683).
    """

    name = "blockplugin"
    template = "cms/toolbar/plugin.html"
    options = Options(Argument("plugin"), blocks=[("endblockplugin", "nodelist")])

    # pylint: disable=arguments-differ
    def render_tag(self, context, plugin, nodelist):
        """
        Renders the block for the plugin and returns the resulting HTML leaving the temmpate
        context untouched.
        If the placholder is editable, the edit script and markup are added to the rendered HTML.
        """
        request = context.get("request")
        if not plugin or not request:
            return ""

        # Add the plugin and its rendered content to an internal context
        internal_context = flatten_context(context)
        internal_context["instance"] = plugin
        internal_context["content"] = nodelist.render(context.new(internal_context))

        # Add the edit script and markup to the content, only if the placeholder is editable
        # and the visited page is the one on which the plugin's placeholder is declared.
        toolbar = get_toolbar_from_request(request)
        if plugin.placeholder.page == request.current_page and toolbar.edit_mode_active:
            return render_to_string(self.template, internal_context)

        return internal_context["content"]


@register.filter()
def is_empty_placeholder(page, slot):
    """A template filter to determine if a placeholder is empty.

    This is useful when we don't want to include any wrapper markup in our template unless
    the placeholder unless it actually contains plugins.
    """
    placeholder = page.placeholders.get(slot=slot)
    return not placeholder.cmsplugin_set.exists()


@register.filter()
def order_by(queryset, args):
    """A template filter to force ordering on a queryset.

    Taken from: https://djangosnippets.org/snippets/741/
    This is useful for DjangoCMS page querysets because we don't have access to the view.
    """
    args = [x.strip() for x in args.split(",")]
    return queryset.order_by(*args)


@register.filter()
def has_connected_lms(course_run):
    """
    Determine if the passed course run has a connected LMS (as determined through out LMSHandler
    and settings).
    This enables our templates to either use the <CourseRunEnrollment /> component or a simple
    link to the course run.
    """
    return LMSHandler.select_lms(course_run.resource_link) is not None


@register.simple_tag(takes_context=True)
def course_enrollment_widget_props(context):
    """
    Return a json dumps which contains all course_run's properties required by
    CourseEnrollment React widget
    """
    course_run = context["run"]

    profile_urls = json.loads(
        context.get("AUTHENTICATION", {}).get("profile_urls", "{}")
    )
    dashboard_link = profile_urls.get("dashboard", {}).get("action")

    starts_in_message = None
    if course_run.start > timezone.now():
        course_start = arrow.get(course_run.start)
        humanized_course_start = course_start.humanize(
            arrow.now(), locale=to_locale(get_language())
        )
        # Translators: delay indicates when the course will start as a duration.
        # In english the string will be "The course will start in 3 days"
        starts_in_message = _("The course will start {delay:s}").format(
            delay=humanized_course_start
        )

    return json.dumps(
        {
            "courseRun": {
                "id": course_run.id,
                "resource_link": course_run.resource_link,
                "priority": course_run.state["priority"],
                "starts_in_message": starts_in_message,
                "dashboard_link": dashboard_link,
            }
        }
    )
