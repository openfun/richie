"""
Utils that can be useful throughout Richie's courses app
"""
from django.utils.text import slugify


def normalize_code(code):
    """Normalize object codes to avoid duplicates."""
    return slugify(code, allow_unicode=True).upper() if code else None
