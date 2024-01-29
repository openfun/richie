"""Simple tag related with language and i18n."""

from django import template
from django.conf import settings
from django.utils import translation

# do not use the lazy
from django.utils.translation import gettext as _

register = template.Library()


@register.simple_tag()
def get_original_language_name(language_code):
    """Get language original name on that its locale"""
    with translation.override(language_code):
        lang_name_override = next(
            _(name)
            for language, name in settings.LANGUAGES
            if language == language_code
        )
        return lang_name_override
