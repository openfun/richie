"""Custom template tags for the search application of Richie."""
from django import template
from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import to_locale

from ..defaults import REACT_LOCALES

# pylint: disable=invalid-name
register = template.Library()


@register.filter
def react_locale(value):
    """
    Converts a language (simple ISO639-1 or full language with regions) to an ISO15897 locale
    that is supported by the React frontend.
    """
    value_locale = to_locale(value)
    # pylint: disable=unsupported-membership-test
    if value_locale in REACT_LOCALES:
        return value_locale
    # pylint: disable=not-an-iterable
    for locale in REACT_LOCALES:
        if locale[:2] == value_locale:
            return locale
    raise ImproperlyConfigured(
        f"{value:s} does not correspond to any locale supported by the React frontend."
    )
