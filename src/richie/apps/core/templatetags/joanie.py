"""Custom template tags related to Joanie."""

from django import template

from richie.apps.courses.lms import LMSHandler

register = template.Library()


@register.simple_tag()
def is_joanie_enabled():
    """
    Determines if Joanie is enabled by checking if there is
    an enabled lms backend with attribute `is_joanie` set to True.
    """

    return any(getattr(lms, "is_joanie", False) for lms in LMSHandler.get_lms_classes())
