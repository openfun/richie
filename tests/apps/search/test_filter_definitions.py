"""
Tests for environment ElasticSearch support
"""
from django.test import TestCase

from richie.apps.courses.factories import CategoryFactory
from richie.apps.search.filter_definitions import FILTERS, IndexableFilterDefinition


class FilterDefintionsTestCase(TestCase):
    """
    Unit tests for parts of the filter definitions that are not sufficiently tested by
    integration tests in test_query_courses.py
    """

    def test_filter_definitions_indexable_filter_aggs_include_no_page(self):
        """
        The indexable filters (subjects, levels and organizations) should return a regex matching
        nothing if the corresponding filter pages have not been created.
        """
        for filter_name in ["levels", "subjects", "organizations"]:
            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, "")

            # The result is not set in cache when a page was not found
            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, "")

    def test_filter_definitions_indexable_filter_aggs_include_draft_page(self):
        """
        The indexable filters (subjects, levels and organizations) should return a regex matching
        nothing if the corresponding filter pages are not published.
        """
        for filter_name in ["levels", "subjects", "organizations"]:
            CategoryFactory(page_reverse_id=filter_name)

            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, "")

            # The result is not set in cache when a published page was not found
            with self.assertNumQueries(1):
                self.assertEqual(FILTERS[filter_name].aggs_include, "")

    def test_filter_definitions_indexable_filter_aggs_include_published_page(self):
        """
        The indexable filters (subjects, levels and organizations) should return a regex matching
        only the parent objects if the corresponding filter pages exist and are published.
        """
        for index, filter_name in enumerate(["levels", "subjects", "organizations"]):
            CategoryFactory(page_reverse_id=filter_name, should_publish=True)

            with self.assertNumQueries(1):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include, f".*-000{index+1:d}.{{4}}"
                )

            with self.assertNumQueries(0):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include, f".*-000{index+1:d}.{{4}}"
                )

            # Reset cache for subsequent tests...
            # pylint: disable=protected-access
            FILTERS[filter_name]._base_page = None

            with self.assertNumQueries(1):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include, f".*-000{index+1:d}.{{4}}"
                )

            with self.assertNumQueries(0):
                self.assertEqual(
                    FILTERS[filter_name].aggs_include, f".*-000{index+1:d}.{{4}}"
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
