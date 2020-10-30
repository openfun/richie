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
ES_INDICES_PREFIX = lazy(lambda: settings.RICHIE_ES_INDICES_PREFIX)()

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

FACET_SORTING_DEFAULT = "conf"

FACET_COUNTS_DEFAULT_LIMIT = getattr(settings, "RICHIE_FACET_COUNTS_DEFAULT_LIMIT", 10)
FACET_COUNTS_MAX_LIMIT = getattr(settings, "RICHIE_FACET_COUNTS_MAX_LIMIT", 50)

FILTERS_CONFIGURATION = [
    (
        "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",
        {
            "fragment_map": {"new": [{"term": {"is_new": True}}]},
            "human_name": _("New courses"),
            "min_doc_count": 0,
            "name": "new",
            "position": 0,
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
                        "human_name": _("Availability"),
                        "is_drilldown": True,
                        "min_doc_count": 0,
                        "name": "availability",
                        "position": 1,
                    },
                ),
                (
                    "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                    {
                        "human_name": _("Languages"),
                        # There are too many available languages to show them all, all the time.
                        # Eg. 200 languages, 190+ of which will have 0 matching courses.
                        "min_doc_count": 1,
                        "name": "languages",
                        "position": 5,
                        "sorting": "count",
                    },
                ),
            ],
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableMPTTFilterDefinition",
        {
            "human_name": _("Subjects"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "name": "subjects",
            "position": 2,
            "reverse_id": "subjects",
            "term": "categories",
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableMPTTFilterDefinition",
        {
            "human_name": _("Levels"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "name": "levels",
            "position": 3,
            "reverse_id": "levels",
            "term": "categories",
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableMPTTFilterDefinition",
        {
            "human_name": _("Organizations"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "name": "organizations",
            "position": 4,
            "reverse_id": "organizations",
        },
    ),
    (
        "richie.apps.search.filter_definitions.IndexableFilterDefinition",
        {
            "human_name": _("Persons"),
            "is_autocompletable": True,
            "is_searchable": True,
            "min_doc_count": 0,
            "name": "persons",
            "position": 5,
            "reverse_id": "persons",
        },
    ),
]
