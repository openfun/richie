"""
Tests for the course search form.
"""
from django.http.request import QueryDict
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.search.forms import ItemSearchForm


@override_settings(ALL_LANGUAGES_DICT={"fr": "French", "en": "English"})
class ItemSearchFormTestCase(TestCase):
    """
    Test the course search form.
    """

    def test_forms_items_params_not_required(self):
        """No params are required for the search form."""
        form = ItemSearchForm()
        self.assertTrue(form.is_valid())

    def test_forms_items_empty_querystring(self):
        """The empty query string should be a valid search form."""
        form = ItemSearchForm(data=QueryDict())
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data, {"limit": None, "offset": None, "query": "", "scope": ""}
        )

    def test_forms_courses_limit_greater_than_1(self):
        """The `limit` param should be greater than 1."""
        form = ItemSearchForm(data=QueryDict(query_string="limit=0"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors, {"limit": ["Ensure this value is greater than or equal to 1."]}
        )

    def test_forms_courses_limit_integer(self):
        """The `limit` param should be an integer."""
        form = ItemSearchForm(data=QueryDict(query_string="limit=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"limit": ["Enter a whole number."]})

        form = ItemSearchForm(data=QueryDict(query_string="limit=1"))
        self.assertTrue(form.is_valid())

    def test_forms_courses_offset_greater_than_0(self):
        """The `offset` param should be greater than 0."""
        form = ItemSearchForm(data=QueryDict(query_string="offset=-1"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"offset": ["Ensure this value is greater than or equal to 0."]},
        )

    def test_forms_courses_offset_integer(self):
        """The `offset` param should be an integer."""
        form = ItemSearchForm(data=QueryDict(query_string="offset=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"offset": ["Enter a whole number."]})

        form = ItemSearchForm(data=QueryDict(query_string="offset=1"))
        self.assertTrue(form.is_valid())

    def test_forms_courses_query_between_3_and_100_characters_long(self):
        """The `query` param should be between 3 and 100 characters long."""
        form = ItemSearchForm(data=QueryDict(query_string="query=aa"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at least 3 characters (it has 2)."]},
        )

        form = ItemSearchForm(data=QueryDict(query_string="query=aaa"))
        self.assertTrue(form.is_valid())

        form = ItemSearchForm(
            data=QueryDict(query_string="query={:s}".format("a" * 100))
        )
        self.assertTrue(form.is_valid())

        form = ItemSearchForm(
            data=QueryDict(query_string="query={:s}".format("a" * 101))
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at most 100 characters (it has 101)."]},
        )

    def test_forms_items_single_values_in_querystring(self):
        """
        The fields from filter definitions should be normalized as lists. The fields defined
        on the form should be single values (limit, offset and query)
        """
        form = ItemSearchForm(
            data=QueryDict(query_string=("limit=9&offset=3&query=maths"))
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data, {"limit": 9, "offset": 3, "query": "maths", "scope": ""}
        )

    def test_forms_items_build_es_query_search_by_match_text(self):
        """
        Happy path: build a query that filters items by matching text
        """
        form = ItemSearchForm(
            data=QueryDict(query_string="query=some%20phrase%20terms&limit=20&offset=2")
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.build_es_query(),
            (
                20,
                2,
                {
                    "query": {
                        "match": {
                            "title.fr": {
                                "query": "some phrase terms",
                                "analyzer": "french",
                            }
                        }
                    }
                },
            ),
        )

    def test_forms_items_build_es_query_search_all(self):
        """
        Happy path: a match all query is returned
        """
        form = ItemSearchForm(data=QueryDict(query_string="limit=11&offset=4"))
        self.assertTrue(form.is_valid())
        self.assertEqual(form.build_es_query(), (11, 4, {"query": {"match_all": {}}}))
