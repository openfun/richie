"""
Import custom settings and set up defaults for values the Search app needs
"""
from django.conf import settings
from django.utils.functional import lazy
from django.utils.translation import ugettext_lazy as _

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


CATEGORIES_LOGO_IMAGE_WIDTH = getattr(settings, "CATEGORIES_LOGO_IMAGE_WIDTH", 216)
CATEGORIES_LOGO_IMAGE_HEIGHT = getattr(settings, "CATEGORIES_LOGO_IMAGE_HEIGHT", 216)

COURSES_COVER_IMAGE_WIDTH = getattr(settings, "COURSES_COVER_IMAGE_WIDTH", 216)
COURSES_COVER_IMAGE_HEIGHT = getattr(settings, "COURSES_COVER_IMAGE_HEIGHT", 216)

ORGANIZATIONS_LOGO_IMAGE_WIDTH = getattr(
    settings, "ORGANIZATIONS_LOGO_IMAGE_WIDTH", 216
)
ORGANIZATIONS_LOGO_IMAGE_HEIGHT = getattr(
    settings, "ORGANIZATIONS_LOGO_IMAGE_HEIGHT", 216
)

# Define the scoring boost (in ElasticSearch) related value names receive when using
# full-text search.
# For example, when a user searches for "Science" in full-text, it should match any
# course whose category contains "Science" or a related word, albeit with a lower
# score than courses that include it in their title or description.
# This lower score factor is the boost value we get or set here.
RELATED_CONTENT_MATCHING_BOOST = getattr(
    settings, "RELATED_CONTENT_MATCHING_BOOST", 0.05
)

# Facet sorting mode
SEARCH_SORTING_DEFAULT = getattr(settings, "RICHIE_SEARCH_SORTING", "conf")

FILTERS_DEFAULT = [
    (
        "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",
        {
            "name": "new",
            "human_name": _("New courses"),
            "position": 0,
            "fragment_map": {"new": [{"term": {"is_new": True}}]},
            "values": {"new": _("First session")},
        },
    ),
    (
        "richie.apps.search.filter_definitions.NestingWrapper",
        {
            "name": "course_runs",
            "filters": [
                (
                    "richie.apps.search.filter_definitions.AvailabilityFilterDefinition",
                    {
                        "name": "availability",
                        "human_name": _("Availability"),
                        "position": 1,
                        "is_drilldown": True,
                    },
                ),
                (
                    "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                    {
                        "name": "languages",
                        "human_name": _("Languages"),
                        "position": 5,
                        "sorting": "count",
                    },
                ),
            ],
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        {
            "name": "subjects",
            "human_name": _("Subjects"),
            "position": 2,
            "reverse_id": "subjects",
            "term": "categories",
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        {
            "name": "levels",
            "human_name": _("Levels"),
            "position": 3,
            "reverse_id": "levels",
            "term": "categories",
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        {
            "name": "organizations",
            "human_name": _("Organizations"),
            "position": 4,
            "reverse_id": "organizations",
        },
    ),
]
