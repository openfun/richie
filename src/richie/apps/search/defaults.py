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


def build_filters_configuration() -> list:
    """Build the default richie filters configuration"""
    filters_configuration = []
    if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_NEW_ENABLED", True):
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",
                {
                    "fragment_map": {"new": [{"term": {"is_new": True}}]},
                    "human_name": _("New courses"),
                    "min_doc_count": 0,
                    "name": "new",
                    "position": getattr(
                        settings, "RICHIE_FILTERS_CONFIGURATION_NEW_POSITION", 0
                    ),
                    "sorting": "conf",
                    "values": {"new": _("First session")},
                },
            ),
        )

    if getattr(
        settings, "RICHIE_FILTERS_CONFIGURATION_AVAILABILITY_ENABLED", True
    ) or getattr(settings, "RICHIE_FILTERS_CONFIGURATION_LANGUAGES_ENABLED", True):
        filters_wrapper = []

        if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_AVAILABILITY_ENABLED", True):
            filters_wrapper.append(
                (
                    "richie.apps.search.filter_definitions.AvailabilityFilterDefinition",
                    {
                        "human_name": _("Availability"),
                        "is_drilldown": True,
                        "min_doc_count": 0,
                        "name": "availability",
                        "position": getattr(
                            settings,
                            "RICHIE_FILTERS_CONFIGURATION_AVAILABILITY_POSITION",
                            1,
                        ),
                        "sorting": "conf",
                    },
                )
            )
        if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_LANGUAGES_ENABLED", True):
            filters_wrapper.append(
                (
                    "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                    {
                        "human_name": _("Languages"),
                        # There are too many available languages to show them all, all the time.
                        # Eg. 200 languages, 190+ of which will have 0 matching courses.
                        "min_doc_count": 1,
                        "name": "languages",
                        "position": getattr(
                            settings,
                            "RICHIE_FILTERS_CONFIGURATION_LANGUAGES_POSITION",
                            5,
                        ),
                    },
                )
            )
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.NestingWrapper",
                {"name": "course_runs", "filters": filters_wrapper},
            ),
        )

    if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_SUBJECTS_ENABLED", True):
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",
                {
                    "human_name": _("Subjects"),
                    "is_autocompletable": True,
                    "is_searchable": True,
                    "min_doc_count": 0,
                    "name": "subjects",
                    "position": getattr(
                        settings, "RICHIE_FILTERS_CONFIGURATION_SUBJECTS_POSITION", 2
                    ),
                    "reverse_id": "subjects",
                    "term": "categories",
                },
            ),
        )

    if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_LEVELS_ENABLED", True):
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",
                {
                    "human_name": _("Levels"),
                    "is_autocompletable": True,
                    "is_searchable": True,
                    "min_doc_count": 0,
                    "name": "levels",
                    "position": getattr(
                        settings, "RICHIE_FILTERS_CONFIGURATION_LEVELS_POSITION", 3
                    ),
                    "reverse_id": "levels",
                    "term": "categories",
                },
            ),
        )

    if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_ORGANIZATIONS_ENABLED", True):
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.IndexableHierarchicalFilterDefinition",
                {
                    "human_name": _("Organizations"),
                    "is_autocompletable": True,
                    "is_searchable": True,
                    "min_doc_count": 0,
                    # Note: this is a special name that connects the filter to Organization objects
                    # in Richie as well was the corresponding indexer and API endpoint.
                    "name": "organizations",
                    "position": getattr(
                        settings,
                        "RICHIE_FILTERS_CONFIGURATION_ORGANIZATIONS_POSITION",
                        4,
                    ),
                    "reverse_id": "organizations",
                },
            ),
        )

    if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_PERSONS_ENABLED", True):
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.IndexableFilterDefinition",
                {
                    "human_name": _("Persons"),
                    "is_autocompletable": True,
                    "is_searchable": True,
                    "min_doc_count": 0,
                    # Note: this is a special name that connects the filter to Person objects
                    # in Richie as well was the corresponding indexer and API endpoint.
                    "name": "persons",
                    "position": getattr(
                        settings, "RICHIE_FILTERS_CONFIGURATION_PERSONS_POSITION", 5
                    ),
                    "reverse_id": "persons",
                },
            ),
        )

    if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_LICENCES_ENABLED", True):
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.IndexableFilterDefinition",
                {
                    "human_name": _("Licences"),
                    "is_autocompletable": True,
                    "is_searchable": True,
                    "min_doc_count": 0,
                    "name": "licences",
                    "position": getattr(
                        settings, "RICHIE_FILTERS_CONFIGURATION_LICENCES_POSITION", 6
                    ),
                },
            ),
        )

    if getattr(settings, "RICHIE_FILTERS_CONFIGURATION_PACE_ENABLED", True):
        filters_configuration.append(
            (
                "richie.apps.search.filter_definitions.StaticChoicesFilterDefinition",
                {
                    "fragment_map": {
                        "self-paced": [
                            {"bool": {"must_not": {"exists": {"field": "pace"}}}}
                        ],
                        "lt-1h": [{"range": {"pace": {"lt": 60}}}],
                        "1h-2h": [{"range": {"pace": {"gte": 60, "lte": 120}}}],
                        "gt-2h": [{"range": {"pace": {"gt": 120}}}],
                    },
                    "human_name": _("Weekly pace"),
                    "min_doc_count": 0,
                    "name": "pace",
                    "position": getattr(
                        settings, "RICHIE_FILTERS_CONFIGURATION_PACE_POSITION", 7
                    ),
                    "sorting": "conf",
                    "values": {
                        "self-paced": _("Self-paced"),
                        "lt-1h": _("Less than one hour"),
                        "1h-2h": _("One to two hours"),
                        "gt-2h": _("More than two hours"),
                    },
                },
            ),
        )
    return filters_configuration


# Default filters configuration.
# If you want to hide a specific filter just disable it using the
# `RICHIE_FILTERS_CONFIGURATION_<name>_ENABLED` setting.
# If you want to change the order of the filter use the
# `RICHIE_FILTERS_CONFIGURATION_<name>_POSITION` setting.
FILTERS_CONFIGURATION = build_filters_configuration()
