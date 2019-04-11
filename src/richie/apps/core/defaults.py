"""Default settings for the core app of Richie."""
from django.conf import global_settings, settings
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
