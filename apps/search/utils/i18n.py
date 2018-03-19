"""
i18n utilities for our search app
"""
from django.conf import settings


def get_best_field_language(multilingual_field, best_language):
    """
    Pick the best available language from a multilingual field.

    A multilingual field is eg:
        'title': {
            'es': 'mi título',
            'fr': 'mon titre',
        }

    1. Use the most appropriate language as determined by the consumer
    2. Default to language #0, then #1, then #2, etc. in settings.LANGUAGES
    """
    for language in [best_language] + [lang for lang, _ in settings.LANGUAGES]:
        try:
            return multilingual_field[language]
        except KeyError:
            pass
