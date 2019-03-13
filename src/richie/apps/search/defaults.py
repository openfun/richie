"""
Import custom settings and set up defaults for values the Search app needs
"""
from django.conf import settings
from django.utils.translation import gettext as _

COURSES_COVER_IMAGE_WIDTH = getattr(settings, "COURSES_COVER_IMAGE_WIDTH", 216)
COURSES_COVER_IMAGE_HEIGHT = getattr(settings, "COURSES_COVER_IMAGE_HEIGHT", 216)

ORGANIZATIONS_LOGO_IMAGE_WIDTH = getattr(
    settings, "ORGANIZATIONS_LOGO_IMAGE_WIDTH", 216
)
ORGANIZATIONS_LOGO_IMAGE_HEIGHT = getattr(
    settings, "ORGANIZATIONS_LOGO_IMAGE_HEIGHT", 216
)

CATEGORIES_LOGO_IMAGE_WIDTH = getattr(settings, "CATEGORIES_LOGO_IMAGE_WIDTH", 216)
CATEGORIES_LOGO_IMAGE_HEIGHT = getattr(settings, "CATEGORIES_LOGO_IMAGE_HEIGHT", 216)


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
                    },
                ),
                (
                    "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                    {
                        "name": "languages",
                        "human_name": _("Languages"),
                        "position": 4,
                        "sorting": "count",
                    },
                ),
            ],
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        {"name": "categories", "human_name": _("Categories"), "position": 2},
    ),
    (
        "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        {"name": "organizations", "human_name": _("Organizations"), "position": 3},
    ),
]
