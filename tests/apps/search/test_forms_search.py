"""
Tests for the search form.
"""
from django.test import TestCase

from richie.apps.search.forms import SearchForm


class SearchFormTestCase(TestCase):
    """Test the generic search form that serves as basis for all search queries."""

    def test_forms_search_params_not_required(self):
        """No params are required for the search form."""
        form = SearchForm(data={})
        self.assertTrue(form.is_valid())

    def test_forms_search_limit_greater_than_1(self):
        """The `limit` param should be greater than 1."""
        form = SearchForm(data={"limit": 0})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors, {"limit": ["Ensure this value is greater than or equal to 1."]}
        )

    def test_forms_search_limit_integer(self):
        """The `limit` param should be an integer."""
        form = SearchForm(data={"limit": "a"})
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"limit": ["Enter a whole number."]})

        form = SearchForm(data={"limit": 1})
        self.assertTrue(form.is_valid())

    def test_forms_search_offset_greater_than_0(self):
        """The `offset` param should be greater than 0."""
        form = SearchForm(data={"offset": -1})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"offset": ["Ensure this value is greater than or equal to 0."]},
        )

    def test_forms_search_offset_integer(self):
        """The `offset` param should be an integer."""
        form = SearchForm(data={"offset": "a"})
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"offset": ["Enter a whole number."]})

        form = SearchForm(data={"offset": 1})
        self.assertTrue(form.is_valid())

    def test_forms_search_query_between_3_and_100_characters_long(self):
        """The `query` param should be between 3 and 100 characters long."""
        form = SearchForm(data={"query": "a" * 2})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at least 3 characters (it has 2)."]},
        )

        form = SearchForm(data={"query": "a" * 3})
        self.assertTrue(form.is_valid())

        form = SearchForm(data={"query": "a" * 100})
        self.assertTrue(form.is_valid())

        form = SearchForm(data={"query": "a" * 101})
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at most 100 characters (it has 101)."]},
        )
