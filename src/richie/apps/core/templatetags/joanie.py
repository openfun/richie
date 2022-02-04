"""Custom template tags related to Joanie."""
from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag()
def is_joanie_enabled():
    """
    Determines if Joanie is enabled

    Within settings, JOANIE can be enabled/disabled by setting the value of
    `JOANIE.BASE_URL` with the url of joanie endpoint.
    """
    if getattr(settings, "JOANIE", None) is not None:
        return settings.JOANIE.get("BASE_URL") is not None

    return False
