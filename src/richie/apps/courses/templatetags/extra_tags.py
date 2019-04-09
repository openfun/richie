"""Custom template tags for the courses application of Richie."""
from django import template

from classytags.arguments import Argument, MultiValueArgument
from cms.exceptions import PlaceholderNotFound
from cms.templatetags.cms_tags import (
    Placeholder,
    PlaceholderOptions,
    _get_page_by_untyped_arg,
)
from cms.toolbar.utils import get_toolbar_from_request
from cms.utils import get_site_id
from cms.utils.placeholder import validate_placeholder_name

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
        page_lookup: lookup argument for Page. See _get_page_by_untyped_arg() for detailed
            information on the allowed types and their interpretation for the page_lookup argument.
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


@register.filter("is_empty_placeholder")
def is_empty_placeholder(page, slot):
    """A template filter to determine if a placeholder is empty.

    This is useful when we don't want to include any wrapper markup in our template unless
    the placeholder unless it actually contains plugins.
    """
    placeholder = page.placeholders.get(slot=slot)
    return not placeholder.cmsplugin_set.exists()
