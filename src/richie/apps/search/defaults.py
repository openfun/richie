"""
Import custom settings and set up defaults for values the Search app needs
"""
from django.conf import settings
from django.forms import MultipleChoiceField

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

# Define our aggregations names, for our ES query, which will match with the field
# names on the objects & the facets we return on the API response
RESOURCE_FACETS = getattr(
    settings, "RICHIE_SEARCH_RESOURCE_FACETS", ["organizations", "categories"]
)

FILTERS_HARDCODED_DEFAULT = {
    "availability": {
        "field": MultipleChoiceField,
        "choices": {
            "coming_soon": [
                {
                    "range": {
                        "start": {
                            "gte": arrow.utcnow().datetime,
                            "lte": arrow.utcnow().shift(weeks=+12).datetime,
                        }
                    }
                }
            ],
            "current": [
                {"range": {"start": {"lte": arrow.utcnow().datetime}}},
                {"range": {"end": {"gte": arrow.utcnow().datetime}}},
                {"range": {"enrollment_start": {"lte": arrow.utcnow().datetime}}},
                {"range": {"enrollment_end": {"gte": arrow.utcnow().datetime}}},
            ],
            "open": [
                {"range": {"start": {"lte": arrow.utcnow().datetime}}},
                {"range": {"end": {"gte": arrow.utcnow().datetime}}},
            ],
        },
    },
    "language": {
        "field": MultipleChoiceField,
        "choices": {lang: [{"term": {"languages": lang}}] for lang in ["en", "fr"]},
    },
    "new": {
        "field": MultipleChoiceField,
        "choices": {"new": [{"term": {"is_new": True}}]},
    },
}

FILTERS_HARDCODED = getattr(
    settings, "RICHIE_SEARCH_FILTERS_HARDCODED", FILTERS_HARDCODED_DEFAULT
)
