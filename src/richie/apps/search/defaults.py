"""
Import custom settings and set up defaults for values the Search app needs
"""
from django.conf import settings
from django.forms import MultipleChoiceField
from django.utils.translation import gettext as _

import arrow

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

FILTERS_DEFAULT = [
    (
        "richie.apps.search.utils.filter_definitions.FilterDefinitionCustom",
        {
            "name": "new",
            "human_name": _("New courses"),
            "choices": [("new", _("First session"), [{"term": {"is_new": True}}])],
        },
    ),
    (
        "richie.apps.search.utils.filter_definitions.FilterDefinitionCustom",
        {
            "name": "availability",
            "human_name": _("Availability"),
            "choices": [
                (
                    "coming_soon",
                    _("Coming soon"),
                    [
                        {
                            "range": {
                                "start": {
                                    "gte": arrow.utcnow().datetime,
                                    "lte": arrow.utcnow().shift(weeks=+12).datetime,
                                }
                            }
                        }
                    ],
                ),
                (
                    "current",
                    _("Current session"),
                    [
                        {"range": {"start": {"lte": arrow.utcnow().datetime}}},
                        {"range": {"end": {"gte": arrow.utcnow().datetime}}},
                        {
                            "range": {
                                "enrollment_start": {"lte": arrow.utcnow().datetime}
                            }
                        },
                        {"range": {"enrollment_end": {"gte": arrow.utcnow().datetime}}},
                    ],
                ),
                (
                    "open",
                    _("Open for enrollment"),
                    [
                        {"range": {"start": {"lte": arrow.utcnow().datetime}}},
                        {"range": {"end": {"gte": arrow.utcnow().datetime}}},
                    ],
                ),
            ],
        },
    ),
    (
        "richie.apps.search.utils.filter_definitions.FilterDefinitionTerms",
        {"name": "categories", "human_name": _("Categories")},
    ),
    (
        "richie.apps.search.utils.filter_definitions.FilterDefinitionTerms",
        {"name": "organizations", "human_name": _("Organizations")},
    ),
    (
        "richie.apps.search.utils.filter_definitions.FilterDefinitionLanguages",
        {"name": "languages", "human_name": _("Languages")},
    ),
]
FILTERS = getattr(settings, "RICHIE_SEARCH_FILTERS", FILTERS_DEFAULT)


# Define our aggregations names, for our ES query, which will match with the field
# names on the objects & the facets we return on the API response
FILTERS_DYNAMIC = getattr(
    settings,
    "RICHIE_SEARCH_FILTERS_DYNAMIC",
    ["categories", "languages", "organizations"],
)

FILTERS_HARDCODED_DEFAULT = {
    filterParams["name"]: {
        "field": MultipleChoiceField,
        "choices": {
            choice_name: choice_fragment
            for choice_name, _, choice_fragment in filterParams["choices"]
        },
    }
    for className, filterParams in FILTERS_DEFAULT
    if "choices" in filterParams
}

FILTERS_HARDCODED = getattr(
    settings, "RICHIE_SEARCH_FILTERS_HARDCODED", FILTERS_HARDCODED_DEFAULT
)
