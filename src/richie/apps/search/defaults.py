"""
Import custom settings and set up defaults for values the Search app needs
"""

from django.conf import settings
from django.utils.functional import lazy
from django.utils.translation import gettext_lazy as _

# Elasticsearch
ES_CHUNK_SIZE = 500
ES_PAGE_SIZE = 10

# Use a lazy to enable easier testing by not defining the value at bootstrap time
ES_INDICES_PREFIX = lazy(
    lambda: getattr(settings, "RICHIE_ES_INDICES_PREFIX", "richie")
)()

# Define which analyzer should be used for each language
QUERY_ANALYZERS = getattr(
    settings, "RICHIE_QUERY_ANALYZERS", {"en": "english", "fr": "french"}
)

# Define the scoring boost (in ElasticSearch) related value names receive when using
# full-text search.
# For example, when a user searches for "Science" in full-text, it should match any
# course whose category contains "Science" or a related word, albeit with a lower
# score than courses that include it in their title or description.
# This lower score factor is the boost value we get or set here.
RELATED_CONTENT_BOOST = 0.05

FACET_SORTING_DEFAULT = "count"

FACET_COUNTS_DEFAULT_LIMIT = getattr(settings, "RICHIE_FACET_COUNTS_DEFAULT_LIMIT", 10)
FACET_COUNTS_MAX_LIMIT = getattr(settings, "RICHIE_FACET_COUNTS_MAX_LIMIT", 50)

ES_STATE_WEIGHTS = getattr(settings, "RICHIE_ES_STATE_WEIGHTS", None) or [
    80,  # ONGOING_OPEN
    70,  # FUTURE_OPEN
    60,  # ARCHIVED_OPEN
    30,  # FUTURE_NOT_YET_OPEN
    6,  # FUTURE_CLOSED
    5,  # ONGOING_CLOSED
    1,  # ARCHIVED_CLOSED
]

DEFAULT_FILTERS_CONFIGURATION = {
    # Note: the key is a special name that connects the filter to page objects
    # in Richie as well as the corresponding indexer and API endpoint.
    "new": {
        "class": "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",
        "params": {
            "fragment_map": {"new": [{"term": {"is_new": True}}]},
            "human_name": _("New courses"),
            "min_doc_count": 0,
            "sorting": "conf",
            "values": {"new": _("First session")},
        },
    },
    "course_runs": {
        "class": "richie.apps.search.filter_definitions.NestingWrapper",
        "params": {
            "filters": {
                "availability": {
                    "class": "richie.apps.search.filter_definitions.AvailabilityFilterDefinition",
                    "params": {
                        "human_name": _("Availability"),
                        "is_drilldown": True,
                        "min_doc_count": 0,
                        "sorting": "conf",
                    },
                },
                "languages": {
                    "class": "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                    "params": {
                        "human_name": _("Languages"),
                        # There are too many available languages to show them all, all the time.
                        # Eg. 200 languages, 190+ of which will have 0 matching courses.
                        "min_doc_count": 1,
                    },
                },
            }
        },
    },
    "subjects": {
        "class": "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",
        "params": {
            "human_name": _("Subjects"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "reverse_id": "subjects",
            "term": "categories",
        },
    },
    "levels": {
        "class": "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",
        "params": {
            "human_name": _("Levels"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "reverse_id": "levels",
            "term": "categories",
        },
    },
    "organizations": {
        "class": "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",
        "params": {
            "human_name": _("Organizations"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "reverse_id": "organizations",
        },
    },
    "persons": {
        "class": "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        "params": {
            "human_name": _("Persons"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "reverse_id": "persons",
        },
    },
    "licences": {
        "class": "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        "params": {
            "human_name": _("Licences"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
        },
    },
    "pace": {
        "class": "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",
        "params": {
            "fragment_map": {
                "self-paced": [{"bool": {"must_not": {"exists": {"field": "pace"}}}}],
                "lt-1h": [{"range": {"pace": {"lt": 60}}}],
                "1h-2h": [{"range": {"pace": {"gte": 60, "lte": 120}}}],
                "gt-2h": [{"range": {"pace": {"gt": 120}}}],
            },
            "human_name": _("Weekly pace"),
            "min_doc_count": 0,
            "sorting": "conf",
            "values": {
                "self-paced": _("Self-paced"),
                "lt-1h": _("Less than one hour"),
                "1h-2h": _("One to two hours"),
                "gt-2h": _("More than two hours"),
            },
        },
    },
}

FILTERS_CONFIGURATION = getattr(
    settings, "RICHIE_FILTERS_CONFIGURATION", DEFAULT_FILTERS_CONFIGURATION
)


FILTERS_PRESENTATION = getattr(
    settings,
    "RICHIE_FILTERS_PRESENTATION",
    [
        "new",
        "availability",
        "subjects",
        "levels",
        "organizations",
        "languages",
        "persons",
        "licences",
        "pace",
    ],
)
