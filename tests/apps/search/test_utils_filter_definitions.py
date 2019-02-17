"""
Test for our FilterDefintion classes
"""
from django.test import TestCase

from richie.apps.search.utils.filter_definitions import (
    FilterDefinitionCustom,
    FilterDefinitionTerms,
)


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

    def test_filter_definition_terms_init(self):
        """
        FilterDefinitionTerms implements the common attributes.
        """
        filterdef = FilterDefinitionTerms(name="languages", human_name="Langues")
        self.assertEqual(filterdef.name, "languages")
        self.assertEqual(filterdef.human_name, "Langues")

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
