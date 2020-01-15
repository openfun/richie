"""
Template context processors for the courses app.
"""
from .defaults import PAGES_SETTINGS


def page_settings(request):
    """
    Context processor that makes available general page related settings in templates.
    """
    return {"PAGES_SETTINGS": PAGES_SETTINGS}
