"""Default settings for the core app of Richie."""
from django.conf import global_settings, settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.functional import lazy
from django.utils.translation import ugettext_lazy as _

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

# The React i18n library only works with ISO15897 locales (e.g. fr_FR)
# Django also supports ISO639-1 language codes without a region (e.g. fr) which is sufficient
# if you don't need to differentiate several regional versions of the same language.
#
# You need to make sure a locale corresponding to your language exists in the locales
# supported by the React frontend.
#
# The order matters, because the first matching locale will be used if your LANGUAGES setting
# declares languages without regions.
REACT_LOCALES = lazy(
    lambda: getattr(settings, "REACT_LOCALES", ["en_US", "es_ES", "fr_FR", "fr_CA"]),
    list,
)()
