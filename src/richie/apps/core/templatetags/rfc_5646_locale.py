"""Custom template tags for the search application of Richie."""
from django import template
from django.core.exceptions import ImproperlyConfigured

from ..defaults import RFC_5646_LOCALES

# pylint: disable=invalid-name
register = template.Library()


@register.filter
def rfc_5646_locale(value):
    """
    Converts a language (simple ISO639-1 or full language with regions) to a BCP47/RFC5646 locale.
    This will allow us to use this locale on the <html lang> attribute directly.
    """
    if "_" in value or "-" in value:
        value_locale = value[:2].lower() + "-" + value[3:].upper()  # noqa
    else:
        value_locale = value.lower()
    # pylint: disable=unsupported-membership-test
    if value_locale in RFC_5646_LOCALES:
        return value_locale
    # pylint: disable=not-an-iterable
    for locale in RFC_5646_LOCALES:
        if locale[:2] == value_locale:
            return locale
    raise ImproperlyConfigured(
        f"{value:s} does not correspond to any supported RFC 5646 locale."
    )
