"""Custom template tags related to FEATURES settings."""

from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag()
def is_feature_enabled(flag):
    """
    template tag to know if a feature flag is enable / disable
    """
    if hasattr(settings, "FEATURES"):
        return settings.FEATURES.get(flag, False)
    return False
