"""Custom template tags for the courses application of Richie."""
from django import template
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import render_to_string

from classytags.arguments import Argument, MultiValueArgument
from classytags.core import Options, Tag
from classytags.utils import flatten_context
from cms.exceptions import PlaceholderNotFound
from cms.templatetags.cms_tags import (
    Placeholder,
    PlaceholderOptions,
    _get_page_by_untyped_arg,
)
from cms.toolbar.utils import get_toolbar_from_request
from cms.utils import get_site_id
from cms.utils.placeholder import validate_placeholder_name
from cms.utils.plugins import get_plugins

# pylint: disable=invalid-name
register = template.Library()


@register.tag("page_placeholder")
class PagePlaceholder(Placeholder):
    """
    This template node is used to output page content and
    is also used in the admin to dynamically generate input fields.
    eg:
    {% page_placeholder "sidebar" page_lookup %}
    {% page_placeholder "sidebar" page_lookup inherit %}
    {% page_placeholder "sidebar" page_lookup as varname %}
    {% page_placeholder "sidebar" page_lookup or %}
        <div>No content</div>
    {% endpage_placeholder %}
    Keyword arguments:
        name: the name of the placeholder
        page_lookup: lookup argument for Page. See `_get_page_by_untyped_arg()` for detailed
            information on the allowed types and their interpretation for the `page_lookup`
            argument.
        inherit : optional argument which if given will result in inheriting
            the content of the placeholder with the same name on parent pages
        varname: context variable name. Output will be added to template context as this variable
            instead of being returned.
        or: optional argument which if given will make the template tag a block
            tag whose content is shown if the placeholder is empty
    """

    name = "page_placeholder"
    options = PlaceholderOptions(
        Argument("name", resolve=False),
        Argument("page_lookup"),
        MultiValueArgument("extra_bits", required=False, resolve=False),
        blocks=[("endpage_placeholder", "nodelist")],
    )

    # pylint: disable=arguments-differ,too-many-arguments
    def render_tag(self, context, name, page_lookup, extra_bits, nodelist=None):
        validate_placeholder_name(name)

        request = context.get("request")

        if request:
            page = _get_page_by_untyped_arg(page_lookup, request, get_site_id(None))

            toolbar = get_toolbar_from_request(request)
            renderer = toolbar.get_content_renderer()

            inherit = "inherit" in extra_bits

            # A placeholder is only editable on its own page
            editable = page == request.current_page

            try:
                content = renderer.render_page_placeholder(
                    slot=name,
                    context=context,
                    inherit=inherit,
                    page=page,
                    nodelist=nodelist,
                    editable=editable,
                )
            except PlaceholderNotFound:
                content = ""
        else:
            content = ""

        if not content and nodelist:
            content = nodelist.render(context)

        if "as" in extra_bits:
            try:
                varname = extra_bits[extra_bits.index("as") + 1]
            except IndexError:
                raise template.TemplateSyntaxError(
                    'the "as" word should be followed by the variable name'
                )
            context[varname] = content
            return ""

        return content


@register.tag("get_placeholder_plugins")
class GetPlaceholderPlugins(Placeholder):
    """
    A template tag that declares a placeholder and sets its plugins as a context variable
    instead of rendering them eg:

        {% get_placeholder_plugins "logo" as varname %}
        {% get_placeholder_plugins "logo" page_lookup as varname %}
        {% get_placeholder_plugins "logo" page_lookup as varname or %}
            <div>No content</div>
        {% endget_placeholder_plugins %}

    This tag can typically be used in association with the block_plugin tag, in a placeholder
    limited to one plugin, to customize the way it is rendered eg:

        {% get_placeholder_plugins "logo" page_lookup as plugins %}
        {% blockplugin plugins.0 %}
            <img src="{% thumbnail instance.picture 300x150 %}"/>
        {% endblockplugin %}

    Keyword arguments:
        name: the name of the placeholder
        page_lookup[optional]: lookup argument for Page. See `_get_page_by_untyped_arg()`
            for detailed information on the allowed types and their interpretation for the
            `page_lookup` argument.
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
        Argument("page_lookup", required=False),
        "as",
        Argument("varname", resolve=False),
        MultiValueArgument("extra_bits", required=False, resolve=False),
        blocks=[("endget_placeholder_plugins", "nodelist")],
    )

    # pylint: disable=arguments-differ,too-many-arguments
    def render_tag(
        self, context, name, page_lookup, varname, extra_bits, nodelist=None
    ):
        """
        Retrieves the placeholder's plugins and set them as a variable in the template context.
        If the placeholder is empty, render the block as fallback content and return the
        resulting HTML.
        If the placholder is editable, the edit script and markup are added to the HTML content.
        """
        content = ""
        request = context.get("request")

        if request:

            page = _get_page_by_untyped_arg(page_lookup, request, get_site_id(None))

            try:
                placeholder = page.placeholders.get(slot=name)
            except ObjectDoesNotExist:
                context[varname] = []
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
