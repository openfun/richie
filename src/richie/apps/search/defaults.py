"""
Import custom settings and set up defaults for values the Search app needs
"""
from django.conf import settings
from django.forms import MultipleChoiceField

import arrow

# Define our aggregations names, for our ES query, which will match with the field
# names on the objects & the facets we return on the API response
RESOURCE_FACETS = getattr(
    settings, "RICHIE_SEARCH_RESOURCE_FACETS", ["organizations", "subjects"]
)

FILTERS_HARDCODED_DEFAULT = {
    "availability": {
        "field": MultipleChoiceField,
        "choices": {
            "coming_soon": [
                {
                    "range": {
                        "start_date": {
                            "gte": arrow.utcnow().datetime,
                            "lte": arrow.utcnow().shift(weeks=+12).datetime,
                        }
                    }
                }
            ],
            "current": [
                {"range": {"start_date": {"lte": arrow.utcnow().datetime}}},
                {"range": {"end_date": {"gte": arrow.utcnow().datetime}}},
                {"range": {"enrollment_start_date": {"lte": arrow.utcnow().datetime}}},
                {"range": {"enrollment_end_date": {"gte": arrow.utcnow().datetime}}},
            ],
            "open": [
                {"range": {"start_date": {"lte": arrow.utcnow().datetime}}},
                {"range": {"end_date": {"gte": arrow.utcnow().datetime}}},
            ],
        },
    },
    "language": {
        "field": MultipleChoiceField,
        "choices": {lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]},
    },
    "new": {
        "field": MultipleChoiceField,
        "choices": {"new": [{"term": {"session_number": 1}}]},
    },
}

FILTERS_HARDCODED = getattr(
    settings, "RICHIE_SEARCH_FILTERS_HARDCODED", FILTERS_HARDCODED_DEFAULT
)
