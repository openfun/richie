"""Template filter to collapse whitespace in text rendered from indented templates."""

from django import template
from django.template.defaultfilters import stringfilter

# pylint: disable=invalid-name
register = template.Library()


@register.filter(is_safe=True)
@stringfilter
def normalize_whitespace(value):
    """
    Collapse any run of whitespace (spaces, tabs, newlines) to a single space and strip
    leading/trailing whitespace.

    Template blocks are usually written on several indented lines, which leaks the
    indentation into text nodes such as ``<title>``. Browsers collapse it, but crawlers
    and SEO tools see the raw string.
    """
    return " ".join(value.split())
