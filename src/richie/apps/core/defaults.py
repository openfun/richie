"""Default settings for the core app of Richie."""

from django.conf import global_settings, settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.functional import lazy
from django.utils.translation import gettext_lazy as _

# Group to add plugin to placeholder "Content"
PLUGINS_GROUP = _("Richie Plugins")

# Django sets `LANGUAGES` by default with all supported languages. We can use it for example for
# the choice of languages on the course run which should not be limited to the few languages
# active in the CMS.
# pylint: disable=no-member
ALL_LANGUAGES = getattr(
    settings,
    "ALL_LANGUAGES",
    [(language, _(name)) for language, name in global_settings.LANGUAGES],
)
ALL_LANGUAGES_DICT = dict(ALL_LANGUAGES)

# Careful! Languages should be ordered by priority, as this tuple is used to get
# fallback/default languages throughout the app.
# Use "en" as default as it is the language that is most likely to be spoken by any visitor
# when their preferred language, whatever it is, is unavailable
LANGUAGES_DICT = dict(settings.LANGUAGES)

# check that all languages in LANGUAGES are matching one of the languages in ALL_LANGUAGES
for site_language in LANGUAGES_DICT:
    generic_language_code = site_language.split("-")[0]
    for language in ALL_LANGUAGES_DICT:
        if language.startswith(generic_language_code):
            break
    else:
        raise ImproperlyConfigured(
            f'"{site_language:s}" in LANGUAGES does not match any language in ALL_LANGUAGES'
        )

# Our frontend expects BCP47/RFC5646 locales (eg. fr-FR). Django, on the other hand,
# supports ISO639-1 language codes without a region (e.g. fr) which is sufficient
# if you don't need to differentiate several regional versions of the same language.
#
# BCP47/RFC5646 lets us specify language-region pairs by combining ISO639-1 language codes and
# ISO3166-1 region codes using a dash (eg. fr-FR).
#
# The only thing we're missing for this to be bridged completely is to make sure locales
# set on the <html> element are also available in our React frontend.
#
# This is where this setting comes in: it lists available locales by order of priority:
# the first matching locale will be used if your LANGUAGES setting declares languages without
# regions.
RFC_5646_LOCALES = lazy(
    lambda: getattr(
        settings, "RFC_5646_LOCALES", ["en-US", "es-ES", "pt-PT", "fr-FR", "fr-CA"]
    ),
    list,
)()

GLIMPSE_PAGINATION = {
    "categories": 8,
    "courses": 8,
    "organizations": 8,
    "blogposts": 6,
    "persons": 4,
    "programs": 4,
}
