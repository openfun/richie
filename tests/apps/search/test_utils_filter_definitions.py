"""
Test for our FilterDefintion classes
"""
from unittest import mock

from django.conf import settings
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.search.utils.filter_definitions import (
    FilterDefinitionCustom,
    FilterDefinitionLanguages,
    FilterDefinitionTerms,
)
from richie.apps.search.utils.indexers import IndicesList


class FilterDefinitionTestCase(TestCase):
    """
    Instantiate our FilterDefinition classes with various parameters and make sure their
    methods generate the proper shapes for ES.
    """

    def test_filter_definition_custom_init(self):
        """
        FilterDefinitionCustom implements the common attributes.
        """
        filterdef = FilterDefinitionCustom(
            name="languages",
            human_name="Langues",
            choices=[("fr", "Français", [{"terms": {"languages": "fr"}}])],
        )
        self.assertEqual(filterdef.name, "languages")
        self.assertEqual(filterdef.human_name, "Langues")
        self.assertEqual(filterdef.is_drilldown, False)

        filterdef = FilterDefinitionCustom(
            name="languages",
            human_name="Langues",
            choices=[("fr", "Français", [{"terms": {"languages": "fr"}}])],
            is_drilldown=True,
        )
        self.assertEqual(filterdef.is_drilldown, True)

    def test_filter_definition_custom_get_query_fragment(self):
        """
        Returns a list of key/fragment pairs mapped to the list of values it received.
        """
        filterdef = FilterDefinitionCustom(
            name="languages",
            human_name="Langues",
            choices=[
                ("en", "English", [{"must": {"languages": "en"}}]),
                ("fr", "Français", [{"must": {"languages": "fr"}}]),
            ],
        )
        # Accepts a single value, as long as it's wrapped in a list
        self.assertEqual(
            filterdef.get_query_fragment(["fr"]),
            [{"key": "languages", "fragment": [{"must": {"languages": "fr"}}]}],
        )
        # Accepts more than one value
        self.assertEqual(
            filterdef.get_query_fragment(["fr", "en"]),
            [
                {"key": "languages", "fragment": [{"must": {"languages": "fr"}}]},
                {"key": "languages", "fragment": [{"must": {"languages": "en"}}]},
            ],
        )

    def test_filter_definition_custom_get_aggs_fragment(self):
        """
        Create a custom aggregation with an ES filtering that reuses all non-related queries
        and that of the specific choice for each of the possible choices.
        """
        filterdef = FilterDefinitionCustom(
            name="availability",
            human_name="Disponibilité",
            choices=[
                ("coming_soon", "Coming soon", [{"is_coming_soon": True}]),
                ("current", "Current", [{"is_current": True}]),
                ("open", "Open for enrollment", [{"is_open": True}]),
            ],
        )
        # Simply uses the query fragment when the queries list is empty
        self.assertEqual(
            filterdef.get_aggs_fragment([]),
            {
                "availability@coming_soon": {
                    "filter": {"bool": {"must": [{"is_coming_soon": True}]}}
                },
                "availability@current": {
                    "filter": {"bool": {"must": [{"is_current": True}]}}
                },
                "availability@open": {
                    "filter": {"bool": {"must": [{"is_open": True}]}}
                },
            },
        )
        # Concatenates the query fragment with the queries list when only non-related
        # fragments are included in the queries list
        self.assertEqual(
            filterdef.get_aggs_fragment(
                [
                    {
                        "key": "categories",
                        "fragment": [{"terms": {"categories": [42, 84]}}],
                    },
                    {"key": "new", "fragment": [{"is_new": True}]},
                ]
            ),
            {
                "availability@coming_soon": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"is_coming_soon": True},
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    }
                },
                "availability@current": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"is_current": True},
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    }
                },
                "availability@open": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"is_open": True},
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    }
                },
            },
        )
        # Removes part of the query related to the current filter if there were any
        self.assertEqual(
            filterdef.get_aggs_fragment(
                [
                    {
                        "key": "categories",
                        "fragment": [{"terms": {"categories": [42, 84]}}],
                    },
                    {"key": "new", "fragment": [{"is_new": True}]},
                    {"key": "availability", "fragment": [{"is_current": True}]},
                ]
            ),
            {
                "availability@coming_soon": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"is_coming_soon": True},
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    }
                },
                "availability@current": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"is_current": True},
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    }
                },
                "availability@open": {
                    "filter": {
                        "bool": {
                            "must": [
                                {"is_open": True},
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    }
                },
            },
        )

    def test_filter_definition_custom_get_faceted_definition(self):
        """
        Return a complete filter definition in a format usable by the frontend, including
        the base definition and the values with their facet counts.
        """
        filterdef = FilterDefinitionCustom(
            name="availability",
            human_name="Disponibilité",
            choices=[
                ("coming_soon", "Coming soon", [{"is_coming_soon": True}]),
                ("current", "Current", [{"is_current": True}]),
                ("open", "Open for enrollment", [{"is_open": True}]),
            ],
        )
        self.assertEqual(
            filterdef.get_faceted_definition(
                {
                    "availability@coming_soon": {"doc_count": 12},
                    "availability@current": {"doc_count": 3},
                    "availability@open": {"doc_count": 7},
                    # Non-availability related facet counts should be ignored here as
                    # we're only generating the availability faceted definition
                    "new@new": {"doc_count": 4},
                    "organizations": {
                        "organizations": {
                            "buckets": [
                                {"key": 42, "doc_count": 11},
                                {"key": 84, "doc_count": 9},
                                {"key": 168, "doc_count": 0},
                            ]
                        }
                    },
                },
                # Language is passed by the course ViewSet but is not useful for custom
                # filter definitions as their human names i18n is managed by gettext
                "fr",
            ),
            {
                "human_name": "Disponibilité",
                "is_drilldown": False,
                "name": "availability",
                "values": [
                    {"human_name": "Coming soon", "key": "coming_soon", "count": 12},
                    {"human_name": "Current", "key": "current", "count": 3},
                    {"human_name": "Open for enrollment", "key": "open", "count": 7},
                ],
            },
        )

    def test_filter_definition_terms_init(self):
        """
        FilterDefinitionTerms implements the common attributes.
        """
        filterdef = FilterDefinitionTerms(
            name="organizations", human_name="Organizations"
        )
        self.assertEqual(filterdef.name, "organizations")
        self.assertEqual(filterdef.human_name, "Organizations")
        self.assertEqual(filterdef.is_drilldown, False)

        filterdef = FilterDefinitionTerms(
            name="organizations", human_name="Organizations", is_drilldown=True
        )
        self.assertEqual(filterdef.is_drilldown, True)

    def test_filter_definition_terms_get_query_fragment(self):
        """
        Returns a terms query fragment along with the filter name as key.
        """
        filterdef = FilterDefinitionTerms(
            name="organizations", human_name="Organizaciónes"
        )
        # Terms query is a list even when there is only one value
        self.assertEqual(
            filterdef.get_query_fragment([42]),
            [
                {
                    "key": "organizations",
                    "fragment": [{"terms": {"organizations": [42]}}],
                }
            ],
        )
        # The fragment is built the same way with more than one value
        self.assertEqual(
            filterdef.get_query_fragment([42, 84]),
            [
                {
                    "key": "organizations",
                    "fragment": [{"terms": {"organizations": [42, 84]}}],
                }
            ],
        )

    def test_filter_definition_terms_get_aggs_fragment(self):
        """
        Use the builtin ES `terms` aggregation, filter with all non-related queries.
        """
        filterdef = FilterDefinitionTerms(
            name="organizations", human_name="Organizaciónes"
        )
        # Simply uses the builtin aggregation when the queries list is empty
        self.assertEqual(
            filterdef.get_aggs_fragment([]),
            {
                "organizations": {
                    "aggregations": {
                        "organizations": {"terms": {"field": "organizations"}}
                    },
                    "filter": {"bool": {"must": []}},
                }
            },
        )
        # Reuses the fragments from the query if none are related to the same filter
        self.assertEqual(
            filterdef.get_aggs_fragment(
                [
                    {
                        "key": "categories",
                        "fragment": [{"terms": {"categories": [42, 84]}}],
                    },
                    {"key": "new", "fragment": [{"is_new": True}]},
                ]
            ),
            {
                "organizations": {
                    "aggregations": {
                        "organizations": {"terms": {"field": "organizations"}}
                    },
                    "filter": {
                        "bool": {
                            "must": [
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    },
                }
            },
        )
        # Drops any fragment related to the same filter
        self.assertEqual(
            filterdef.get_aggs_fragment(
                [
                    {
                        "key": "categories",
                        "fragment": [{"terms": {"categories": [42, 84]}}],
                    },
                    {"key": "new", "fragment": [{"is_new": True}]},
                    {
                        "key": "organizations",
                        "fragment": [{"terms": {"organizations": [33, 66]}}],
                    },
                ]
            ),
            {
                "organizations": {
                    "aggregations": {
                        "organizations": {"terms": {"field": "organizations"}}
                    },
                    "filter": {
                        "bool": {
                            "must": [
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    },
                }
            },
        )

    @override_settings(
        ES_INDICES=IndicesList(
            categories="_", courses="_", organizations="the.class.OrganizationsIndexer"
        )
    )
    @mock.patch("richie.apps.search.utils.filter_definitions.import_string")
    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_filter_definition_terms_get_i18n_names(
        self, mock_search, mock_import_string, *_
    ):
        """
        Use the relevant ES index to build a map of keys to best available i18n human names.
        """

        class OrganizationIndexer:
            """We only use `document_type` & `index_name` from the indexer we import."""

            document_type = "organization"
            index_name = "organization-index"

        mock_import_string.return_value = OrganizationIndexer()
        # Mock a bunch of organization hits from the organization index
        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": "42",
                        "_source": {"title": {"en": "Org 42", "fr": "Orga 42"}},
                    },
                    {
                        "_id": "84",
                        "_source": {"title": {"en": "Org 84", "fr": "Orga 84"}},
                    },
                    {
                        "_id": "168",
                        "_source": {"title": {"en": "Org 168", "fr": "Orga 168"}},
                    },
                ]
            }
        }

        filterdef = FilterDefinitionTerms(
            name="organizations", human_name="Organizations"
        )
        # Build a map with the best i18n name for the given language
        self.assertEqual(
            filterdef.get_i18n_names(["42", "84", "168"], "fr"),
            {"42": "Orga 42", "84": "Orga 84", "168": "Orga 168"},
        )
        mock_import_string.assert_called_once_with("the.class.OrganizationsIndexer")
        mock_search.assert_called_once_with(
            _source=["title.*"],
            index="organization-index",
            doc_type="organization",
            body={
                "query": {
                    "terms": {
                        "_uid": [
                            "organization#42",
                            "organization#84",
                            "organization#168",
                        ]
                    }
                }
            },
            size=3,
        )
        # Make sure the return value changes with the language
        self.assertEqual(
            filterdef.get_i18n_names(["42", "84", "168"], "en"),
            {"42": "Org 42", "84": "Org 84", "168": "Org 168"},
        )

    def test_filter_definition_terms_get_faceted_definition(self):
        """
        Return a complete filter definition in a format usable by the frontend, including
        the base definition and values with their facet counts generated from the passed
        facets directly.
        """
        filterdef = FilterDefinitionTerms(
            name="organizations", human_name="Organizations"
        )

        with mock.patch.object(
            filterdef,
            "get_i18n_names",
            mock.MagicMock(
                return_value={"42": "Orga #42", "84": "Orga #84", "168": "Orga #168"}
            ),
        ) as mock_get_i18n_names:
            self.assertEqual(
                filterdef.get_faceted_definition(
                    {
                        "organizations": {
                            "organizations": {
                                "buckets": [
                                    {"key": "42", "doc_count": 11},
                                    {"key": "84", "doc_count": 9},
                                    {"key": "168", "doc_count": 0},
                                ]
                            }
                        },
                        # Non-organizations related facet counts should be ignored here as
                        # we're only generating the organizations faceted definition
                        "new@new": {"doc_count": 4},
                        "categories": {
                            "categories": {
                                "buckets": [
                                    {"key": "13", "doc_count": 3},
                                    {"key": "26", "doc_count": 5},
                                    {"key": "52", "doc_count": 7},
                                ]
                            }
                        },
                    },
                    "fr",
                ),
                {
                    "human_name": "Organizations",
                    "is_drilldown": False,
                    "name": "organizations",
                    "values": [
                        {"count": 11, "human_name": "Orga #42", "key": "42"},
                        {"count": 9, "human_name": "Orga #84", "key": "84"},
                        {"count": 0, "human_name": "Orga #168", "key": "168"},
                    ],
                },
            )
            mock_get_i18n_names.assert_called_once_with(["42", "84", "168"], "fr")

    def test_filter_definition_languages_init(self):
        """
        FilterDefinitionLanguages implements the common attributes.
        """
        filterdef = FilterDefinitionLanguages(name="languages", human_name="Langues")
        self.assertEqual(filterdef.name, "languages")
        self.assertEqual(filterdef.human_name, "Langues")
        self.assertEqual(filterdef.is_drilldown, False)

        filterdef = FilterDefinitionLanguages(
            name="languages", human_name="Langues", is_drilldown=True
        )
        self.assertEqual(filterdef.is_drilldown, True)

    def test_filter_definition_languages_get_query_fragment(self):
        """
        Returns a terms query fragment along with the filter name as key.
        """
        filterdef = FilterDefinitionLanguages(name="languages", human_name="Langues")
        # Terms query is a list even when there is only one value
        self.assertEqual(
            filterdef.get_query_fragment(["fr"]),
            [{"key": "languages", "fragment": [{"terms": {"languages": ["fr"]}}]}],
        )
        # The fragment is built the same way with more than one value
        self.assertEqual(
            filterdef.get_query_fragment(["fr", "en"]),
            [
                {
                    "key": "languages",
                    "fragment": [{"terms": {"languages": ["fr", "en"]}}],
                }
            ],
        )

    def test_filter_definition_languages_get_aggs_fragment(self):
        """
        Use the builtin ES `terms` aggregation, filter with all non-related queries.
        """
        filterdef = FilterDefinitionLanguages(name="languages", human_name="Langues")
        # Simply uses the builtin aggregation when the queries list is empty
        self.assertEqual(
            filterdef.get_aggs_fragment([]),
            {
                "languages": {
                    "aggregations": {"languages": {"terms": {"field": "languages"}}},
                    "filter": {"bool": {"must": []}},
                }
            },
        )
        # Reuses the fragments from the query if none are related to the same filter
        self.assertEqual(
            filterdef.get_aggs_fragment(
                [
                    {
                        "key": "categories",
                        "fragment": [{"terms": {"categories": [42, 84]}}],
                    },
                    {"key": "new", "fragment": [{"is_new": True}]},
                ]
            ),
            {
                "languages": {
                    "aggregations": {"languages": {"terms": {"field": "languages"}}},
                    "filter": {
                        "bool": {
                            "must": [
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    },
                }
            },
        )
        # Drops any fragment related to the same filter
        self.assertEqual(
            filterdef.get_aggs_fragment(
                [
                    {
                        "key": "categories",
                        "fragment": [{"terms": {"categories": [42, 84]}}],
                    },
                    {"key": "new", "fragment": [{"is_new": True}]},
                    {
                        "key": "languages",
                        "fragment": [{"terms": {"languages": [33, 66]}}],
                    },
                ]
            ),
            {
                "languages": {
                    "aggregations": {"languages": {"terms": {"field": "languages"}}},
                    "filter": {
                        "bool": {
                            "must": [
                                {"terms": {"categories": [42, 84]}},
                                {"is_new": True},
                            ]
                        }
                    },
                }
            },
        )

    @override_settings(ALL_LANGUAGES_DICT={"es": "Español", "fr": "Francès"})
    def test_filter_definition_languages_get_i18n_names(self):
        """
        Languages use a different implementation of get_i18n_names as their i18n names
        are directly available from the settings.
        """
        filterdef = FilterDefinitionLanguages(name="languages", human_name="Langues")
        self.assertEqual(
            # We don't need to bother with the keys nor the preferred language here as all
            # available languages must be in the dict from `ALL_LANGUAGES_DICT`
            filterdef.get_i18n_names([], "fr"),
            {"es": "Español", "fr": "Francès"},
        )

    def test_filter_definition_languages_get_faceted_definition(self):
        """
        Return a complete filter definition in a format usable by the frontend, including
        the base definition and values with their facet counts generated from the passed
        facets directly.
        """
        filterdef = FilterDefinitionLanguages(name="languages", human_name="Langues")

        with mock.patch.object(
            filterdef,
            "get_i18n_names",
            mock.MagicMock(
                return_value={"en": "Anglais", "es": "Espagnol", "fr": "Français"}
            ),
        ) as mock_get_i18n_names:
            self.assertEqual(
                filterdef.get_faceted_definition(
                    {
                        "languages": {
                            "languages": {
                                "buckets": [
                                    {"key": "en", "doc_count": 0},
                                    {"key": "es", "doc_count": 4},
                                    {"key": "fr", "doc_count": 25},
                                ]
                            }
                        },
                        # Non-languages related facet counts should be ignored here as
                        # we're only generating the languages faceted definition
                        "new@new": {"doc_count": 4},
                        "categories": {
                            "categories": {
                                "buckets": [
                                    {"key": "13", "doc_count": 3},
                                    {"key": "26", "doc_count": 5},
                                    {"key": "52", "doc_count": 7},
                                ]
                            }
                        },
                    },
                    "fr",
                ),
                {
                    "human_name": "Langues",
                    "is_drilldown": False,
                    "name": "languages",
                    "values": [
                        {"count": 0, "human_name": "Anglais", "key": "en"},
                        {"count": 4, "human_name": "Espagnol", "key": "es"},
                        {"count": 25, "human_name": "Français", "key": "fr"},
                    ],
                },
            )
            mock_get_i18n_names.assert_called_once_with(["en", "es", "fr"], "fr")
