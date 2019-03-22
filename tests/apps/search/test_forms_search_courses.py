"""
Tests for the course search form.
"""
from django.http.request import QueryDict
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.search.forms import CourseSearchForm


@override_settings(ALL_LANGUAGES_DICT={"fr": "French", "en": "English"})
class CourseSearchFormTestCase(TestCase):
    """
    Test the course search form.
    """

    def test_forms_courses_params_not_required(self):
        """No params are required for the search form."""
        form = CourseSearchForm()
        self.assertTrue(form.is_valid())

    def test_forms_courses_empty_querystring(self):
        """The empty query string should be a valid search form."""
        form = CourseSearchForm(data=QueryDict())
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": [],
                "languages": [],
                "levels": [],
                "limit": None,
                "new": [],
                "offset": None,
                "organizations": [],
                "query": "",
                "subjects": [],
            },
        )

    def test_forms_courses_limit_greater_than_1(self):
        """The `limit` param should be greater than 1."""
        form = CourseSearchForm(data=QueryDict(query_string="limit=0"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors, {"limit": ["Ensure this value is greater than or equal to 1."]}
        )

    def test_forms_courses_limit_integer(self):
        """The `limit` param should be an integer."""
        form = CourseSearchForm(data=QueryDict(query_string="limit=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"limit": ["Enter a whole number."]})

        form = CourseSearchForm(data=QueryDict(query_string="limit=1"))
        self.assertTrue(form.is_valid())

    def test_forms_courses_offset_greater_than_0(self):
        """The `offset` param should be greater than 0."""
        form = CourseSearchForm(data=QueryDict(query_string="offset=-1"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"offset": ["Ensure this value is greater than or equal to 0."]},
        )

    def test_forms_courses_offset_integer(self):
        """The `offset` param should be an integer."""
        form = CourseSearchForm(data=QueryDict(query_string="offset=a"))
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"offset": ["Enter a whole number."]})

        form = CourseSearchForm(data=QueryDict(query_string="offset=1"))
        self.assertTrue(form.is_valid())

    def test_forms_courses_query_between_3_and_100_characters_long(self):
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

    def test_forms_courses_single_values_in_querystring(self):
        """
        The fields from filter definitions should be normalized as lists. The fields defined
        on the form should be single values (limit, offset and query)
        """
        form = CourseSearchForm(
            data=QueryDict(
                query_string=(
                    "availability=coming_soon&levels=1&subjects=1&languages=fr&limit=9&"
                    "offset=3&organizations=10&query=maths&new=new"
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
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10"],
                "query": "maths",
                "subjects": ["1"],
            },
        )

    def test_forms_courses_multi_values_in_querystring(self):
        """
        The fields from filter defintions should allow multiple values. The fields defined
        on the form should ignore repeated values (limit, offset and query).
        """
        form = CourseSearchForm(
            data=QueryDict(
                query_string=(
                    "availability=coming_soon&availability=ongoing&levels=1&levels=2&"
                    "languages=fr&languages=en&limit=9&limit=11&offset=3&offset=17&"
                    "organizations=10&organizations=11&query=maths&query=physics&new=new&"
                    "subjects=1&subjects=2"
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
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10", "11"],
                "query": "maths",
                "subjects": ["1", "2"],
            },
        )

    def test_forms_courses_build_es_query_search_by_match_text(self):
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
                                ]
                            }
                        }
                    ]
                }
            },
        )
