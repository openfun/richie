"""
Tests for environment ElasticSearch support
"""

from django.core.cache import caches
from django.test import TestCase

from richie.apps.courses.factories import CategoryFactory
from richie.apps.search.filter_definitions import FILTERS, IndexableFilterDefinition
from richie.apps.search.filter_definitions.courses import StaticChoicesFilterDefinition


class FilterDefintionsTestCase(TestCase):
    """
    Unit tests for parts of the filter definitions that are not sufficiently tested by
    integration tests in test_query_courses.py
    """

    def test_filter_definitions_indexable_filter_aggs_include_no_page(self):
        """
        The indexable filters (subjects, levels and organizations) should return an empty list
        if the corresponding filter pages have not been created.
        """
        for filter_name in ["levels", "subjects", "organizations"]:
            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, [])

            # The result is not set in cache when a page was not found
            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, [])

    def test_filter_definitions_indexable_filter_aggs_include_draft_page(self):
        """
        The indexable filters (subjects, levels and organizations) should return an empty list
        if the corresponding filter pages are not published.
        """
        for filter_name in ["levels", "subjects", "organizations"]:
            CategoryFactory(page_reverse_id=filter_name)

            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, [])

            # The result is not set in cache when a published page was not found
            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, [])

    def test_filter_definitions_indexable_filter_aggs_include_published_page(self):
        """
        The indexable filters (subjects, levels and organizations) should return a list of objects
        that are direct children of the filter pages if those exist and are published.
        """
        for filter_name in ["levels", "subjects", "organizations"]:
            filter_page = CategoryFactory(
                page_reverse_id=filter_name, should_publish=True
            )
            item = CategoryFactory(
                page_parent=filter_page.extended_object, should_publish=True
            )
            expected_include = [str(item.get_es_id())]

            with self.assertNumQueries(2):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include,
                    expected_include,
                )

            with self.assertNumQueries(0):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include,
                    expected_include,
                )

            # Reset cache for subsequent tests...
            # pylint: disable=protected-access
            FILTERS[filter_name]._base_page = None
            caches["search"].clear()

            with self.assertNumQueries(2):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include,
                    expected_include,
                )

            with self.assertNumQueries(0):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include,
                    expected_include,
                )

            # Reset cache for subsequent tests...
            # pylint: disable=protected-access
            FILTERS[filter_name]._base_page = None

    def test_filter_definitions_indexable_filter_aggs_include_no_reverse_id(self):
        """
        An indexable filter instantiated with no `reverse_id` should return a match all aggs
        include regex.
        """
        indexable_filter_definition = IndexableFilterDefinition("name")
        self.assertEqual(indexable_filter_definition.aggs_include, ".*")

    def test_filter_definitions_choices_query_fragment_single_value(self):
        """
        With a single value selected, a choices filter should return that value's fragment
        as is.
        """
        filter_definition = StaticChoicesFilterDefinition(
            name="pace",
            human_name="Weekly pace",
            values={"lt-1h": "Less than one hour", "gt-2h": "More than two hours"},
            fragment_map={
                "lt-1h": [{"range": {"pace": {"lt": 60}}}],
                "gt-2h": [{"range": {"pace": {"gt": 120}}}],
            },
        )
        self.assertEqual(
            filter_definition.get_query_fragment({"pace": ["gt-2h"]}),
            [{"key": "pace", "fragment": [{"range": {"pace": {"gt": 120}}}]}],
        )
        self.assertEqual(filter_definition.get_query_fragment({"pace": []}), [])
        self.assertEqual(filter_definition.get_query_fragment({}), [])

    def test_filter_definitions_choices_query_fragment_several_values(self):
        """
        With several values selected, a choices filter should combine the fragments of the
        selected values with a "should" clause (OR) instead of letting them be ANDed with
        the other filters' fragments.
        """
        filter_definition = StaticChoicesFilterDefinition(
            name="pace",
            human_name="Weekly pace",
            values={"1h-2h": "One to two hours", "gt-2h": "More than two hours"},
            fragment_map={
                "1h-2h": [{"range": {"pace": {"gte": 60, "lte": 120}}}],
                "gt-2h": [{"range": {"pace": {"gt": 120}}}],
            },
        )
        self.assertEqual(
            filter_definition.get_query_fragment({"pace": ["1h-2h", "gt-2h"]}),
            [
                {
                    "key": "pace",
                    "fragment": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "bool": {
                                            "must": [
                                                {
                                                    "range": {
                                                        "pace": {"gte": 60, "lte": 120}
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        "bool": {
                                            "must": [{"range": {"pace": {"gt": 120}}}]
                                        }
                                    },
                                ],
                                "minimum_should_match": 1,
                            }
                        }
                    ],
                }
            ],
        )
