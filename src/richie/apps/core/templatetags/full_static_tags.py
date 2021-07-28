"""
Add full URL to a static Django file.
https://stackoverflow.com/a/47336360
"""

from django import template
from django.templatetags import static

# pylint: disable=invalid-name
register = template.Library()


class FullStaticNode(static.StaticNode):
    """
    Generate absolute full URL to a static file.
    """

    def url(self, context):
        request = context["request"]
        return request.build_absolute_uri(super().url(context))


@register.tag("static_absolute")
def do_static(parser, token):
    """
    Register the tag static_absolute
    """
    return FullStaticNode.handle_token(parser, token)
