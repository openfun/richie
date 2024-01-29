"""
Tests for the course search form.
"""

from unittest import mock

from django.http.request import QueryDict
from django.test import TestCase

from richie.apps.core.defaults import ALL_LANGUAGES_DICT
from richie.apps.search.forms import ItemSearchForm


@mock.patch.dict(ALL_LANGUAGES_DICT, {"fr": "French", "en": "English"})
class ItemSearchFormTestCase(TestCase):
    """
    Test the course search form.
    """

    def test_forms_items_params_not_required(self, *_):
        """No params are required for the search form."""
        form = ItemSearchForm()
        self.assertTrue(form.is_valid())

    def test_forms_items_empty_querystring(self, *_):
        """The empty query string should be a valid search form."""
        form = ItemSearchForm(data=QueryDict())
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data, {"limit": None, "offset": None, "query": "", "scope": ""}
        )

    def test_forms_items_limit_greater_than_1(self, *_):
        """The `limit` param should be greater than 1."""
        form = ItemSearchForm(data=QueryDict(query_string="limit=0"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors, {"limit": ["Ensure this value is greater than or equal to 1."]}
        )

    def test_forms_items_limit_integer(self, *_):
        """The `limit` param should be an integer."""
        form = ItemSearchForm(data=QueryDict(query_string="limit=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"limit": ["Enter a whole number."]})

        form = ItemSearchForm(data=QueryDict(query_string="limit=1"))
        self.assertTrue(form.is_valid())

    def test_forms_items_offset_greater_than_0(self, *_):
        """The `offset` param should be greater than 0."""
        form = ItemSearchForm(data=QueryDict(query_string="offset=-1"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"offset": ["Ensure this value is greater than or equal to 0."]},
        )

    def test_forms_items_offset_integer(self, *_):
        """The `offset` param should be an integer."""
        form = ItemSearchForm(data=QueryDict(query_string="offset=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"offset": ["Enter a whole number."]})

        form = ItemSearchForm(data=QueryDict(query_string="offset=1"))
        self.assertTrue(form.is_valid())

    def test_forms_items_query_between_3_and_100_characters_long(self, *_):
        """The `query` param should be between 3 and 100 characters long."""
        form = ItemSearchForm(data=QueryDict(query_string="query=aa"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at least 3 characters (it has 2)."]},
        )

        form = ItemSearchForm(data=QueryDict(query_string="query=aaa"))
        self.assertTrue(form.is_valid())

        form = ItemSearchForm(data=QueryDict(query_string=f"query={'a' * 100:s}"))
        self.assertTrue(form.is_valid())

        form = ItemSearchForm(data=QueryDict(query_string=f"query={'a' * 101:s}"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at most 100 characters (it has 101)."]},
        )

    def test_forms_items_single_values_in_querystring(self, *_):
        """
        The fields from filter definitions should be normalized as lists. The fields defined
        on the form should be single values (limit, offset and query).
        """
        form = ItemSearchForm(
            data=QueryDict(query_string="limit=9&offset=3&query=maths")
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data, {"limit": 9, "offset": 3, "query": "maths", "scope": ""}
        )

    def test_forms_items_build_es_query_search_by_match_text(self, *_):
        """
        Happy path: build a query that filters items by matching text
        """
        form = ItemSearchForm(
            data=QueryDict(query_string="limit=20&offset=2&query=some%20phrase%20terms")
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.build_es_query(),
            (
                20,
                2,
                {
                    "query": {
                        "bool": {
                            "must": [
                                {
                                    "multi_match": {
                                        "analyzer": "english",
                                        "fields": ["title.*"],
                                        "query": "some phrase " "terms",
                                    }
                                }
                            ]
                        }
                    }
                },
            ),
        )

    def test_forms_items_build_es_query_by_match_text_with_kind(self, *_):
        """
        Make sure the generated query filters the items by kind when one is provided
        as argument.
        """
        form = ItemSearchForm(
            data=QueryDict(query_string="limit=20&offset=2&query=some%20phrase%20terms")
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.build_es_query(kind="subjects"),
            (
                20,
                2,
                {
                    "query": {
                        "bool": {
                            "must": [
                                {"term": {"kind": "subjects"}},
                                {
                                    "multi_match": {
                                        "analyzer": "english",
                                        "fields": ["title.*"],
                                        "query": "some phrase " "terms",
                                    }
                                },
                            ]
                        }
                    }
                },
            ),
        )

    def test_forms_items_build_es_query_search_all(self, *_):
        """
        Happy path: a match all query is returned
        """
        form = ItemSearchForm(data=QueryDict(query_string="limit=11&offset=4"))
        self.assertTrue(form.is_valid())
        self.assertEqual(form.build_es_query(), (11, 4, {"query": {"match_all": {}}}))
