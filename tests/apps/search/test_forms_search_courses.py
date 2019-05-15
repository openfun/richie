"""
Tests for the course search form.
"""
from unittest import mock

from django.http.request import QueryDict
from django.test import TestCase

from richie.apps.core.defaults import ALL_LANGUAGES_DICT
from richie.apps.search.forms import CourseSearchForm


@mock.patch.dict(ALL_LANGUAGES_DICT, {"fr": "French", "en": "English"})
class CourseSearchFormTestCase(TestCase):
    """
    Test the course search form.
    """

    def test_forms_courses_params_not_required(self, *_):
        """No params are required for the search form."""
        form = CourseSearchForm()
        self.assertTrue(form.is_valid())

    def test_forms_courses_empty_querystring(self, *_):
        """The empty query string should be a valid search form."""
        form = CourseSearchForm(data=QueryDict())
        self.assertTrue(form.is_valid())

        self.assertEqual(
            form.cleaned_data,
            {
                "availability": [],
                "languages": [],
                "levels": [],
                "levels_include": "",
                "limit": None,
                "new": [],
                "offset": None,
                "organizations": [],
                "organizations_include": "",
                "persons": [],
                "persons_include": "",
                "query": "",
                "scope": "",
                "subjects": [],
                "subjects_include": "",
            },
        )

    def test_forms_courses_limit_greater_than_1(self, *_):
        """The `limit` param should be greater than 1."""
        form = CourseSearchForm(data=QueryDict(query_string="limit=0"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors, {"limit": ["Ensure this value is greater than or equal to 1."]}
        )

    def test_forms_courses_limit_integer(self, *_):
        """The `limit` param should be an integer."""
        form = CourseSearchForm(data=QueryDict(query_string="limit=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"limit": ["Enter a whole number."]})

        form = CourseSearchForm(data=QueryDict(query_string="limit=1"))
        self.assertTrue(form.is_valid())

    def test_forms_courses_offset_greater_than_0(self, *_):
        """The `offset` param should be greater than 0."""
        form = CourseSearchForm(data=QueryDict(query_string="offset=-1"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"offset": ["Ensure this value is greater than or equal to 0."]},
        )

    def test_forms_courses_offset_integer(self, *_):
        """The `offset` param should be an integer."""
        form = CourseSearchForm(data=QueryDict(query_string="offset=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"offset": ["Enter a whole number."]})

        form = CourseSearchForm(data=QueryDict(query_string="offset=1"))
        self.assertTrue(form.is_valid())

    def test_forms_courses_query_between_3_and_100_characters_long(self, *_):
        """The `query` param should be between 3 and 100 characters long."""
        form = CourseSearchForm(data=QueryDict(query_string="query=aa"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at least 3 characters (it has 2)."]},
        )

        form = CourseSearchForm(data=QueryDict(query_string="query=aaa"))
        self.assertTrue(form.is_valid())

        form = CourseSearchForm(
            data=QueryDict(query_string="query={:s}".format("a" * 100))
        )
        self.assertTrue(form.is_valid())

        form = CourseSearchForm(
            data=QueryDict(query_string="query={:s}".format("a" * 101))
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"query": ["Ensure this value has at most 100 characters (it has 101)."]},
        )

    def test_forms_courses_single_values_in_querystring(self, *_):
        """
        The fields from filter definitions should be normalized as lists. The fields defined
        on the form should be single values (limit, offset and query)
        """
        form = CourseSearchForm(
            data=QueryDict(
                query_string=(
                    "availability=coming_soon&levels=1&levels_include=.*&languages=fr&limit=9&"
                    "offset=3&organizations=10&organizations_include=.*&query=maths&new=new&"
                    "scope=objects&subjects=1&subjects_include=.*"
                )
            )
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": ["coming_soon"],
                "languages": ["fr"],
                "levels": ["1"],
                "levels_include": ".*",
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10"],
                "organizations_include": ".*",
                "persons": [],
                "persons_include": "",
                "query": "maths",
                "scope": "objects",
                "subjects": ["1"],
                "subjects_include": ".*",
            },
        )

    def test_forms_courses_multi_values_in_querystring(self, *_):
        """
        The fields from filter definitions should allow multiple values. The fields defined
        on the form should ignore repeated values (limit, offset and query).
        """
        form = CourseSearchForm(
            data=QueryDict(
                query_string=(
                    "availability=coming_soon&availability=ongoing&levels=1&levels=2&"
                    "languages=fr&languages=en&limit=9&limit=11&offset=3&offset=17&"
                    "organizations=10&organizations=11&query=maths&query=physics&new=new&"
                    "scope=objects&scope=filters&subjects=1&subjects=2"
                )
            )
        )
        form.is_valid()
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": ["coming_soon", "ongoing"],
                "languages": ["fr", "en"],
                "levels": ["1", "2"],
                "levels_include": "",
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10", "11"],
                "organizations_include": "",
                "persons": [],
                "persons_include": "",
                "query": "maths",
                "scope": "objects",
                "subjects": ["1", "2"],
                "subjects_include": "",
            },
        )

    def test_forms_courses_build_es_query_search_by_match_text(self, *_):
        """
        Happy path: build a query that filters courses by matching text
        """
        form = CourseSearchForm(
            data=QueryDict(query_string="query=some%20phrase%20terms&limit=2&offset=20")
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.build_es_query()[2],
            {
                "bool": {
                    "must": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "multi_match": {
                                            "fields": ["description.*", "title.*"],
                                            "query": "some phrase terms",
                                            "type": "cross_fields",
                                        }
                                    },
                                    {
                                        "multi_match": {
                                            "boost": 0.05,
                                            "fields": [
                                                "categories_names.*",
                                                "organizations_names.*",
                                            ],
                                            "query": "some phrase terms",
                                            "type": "cross_fields",
                                        }
                                    },
                                    {
                                        "multi_match": {
                                            "boost": 0.05,
                                            "fields": ["persons_names.*"],
                                            "query": "some phrase " "terms",
                                            "type": "cross_fields",
                                        }
                                    },
                                ]
                            }
                        }
                    ]
                }
            },
        )
