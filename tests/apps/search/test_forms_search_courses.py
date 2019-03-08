"""
Tests for the course search form.
"""
from django.http.request import QueryDict
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.search.forms import CourseSearchForm
from richie.apps.search.indexers.courses import CoursesIndexer


@override_settings(ALL_LANGUAGES_DICT={"fr": "French", "en": "English"})
class CourseSearchFormTestCase(TestCase):
    """
    Test the course search form.
    """

    def test_forms_courses_empty_querystring(self):
        """The empty query string should be a valid search form."""
        form = CourseSearchForm(data=QueryDict())
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": [],
                "categories": [],
                "languages": [],
                "limit": None,
                "new": [],
                "offset": None,
                "organizations": [],
                "query": "",
            },
        )

    def test_forms_courses_single_values_in_querystring(self):
        """
        The fields from filter definitions should be normalized as lists. The fields defined
        on the form should be single values (limit, offset and query)
        """
        form = CourseSearchForm(
            data=QueryDict(
                query_string=(
                    "availability=coming_soon&categories=1&languages=fr&limit=9&"
                    "offset=3&organizations=10&query=maths&new=new"
                )
            )
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": ["coming_soon"],
                "categories": ["1"],
                "languages": ["fr"],
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10"],
                "query": "maths",
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
                    "availability=coming_soon&availability=ongoing&categories=1&categories=2&"
                    "languages=fr&languages=en&limit=9&limit=11&offset=3&offset=17&"
                    "organizations=10&organizations=11&query=maths&query=physics&new=new"
                )
            )
        )
        form.is_valid()
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": ["coming_soon", "ongoing"],
                "categories": ["1", "2"],
                "languages": ["fr", "en"],
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10", "11"],
                "query": "maths",
            },
        )

    def test_forms_courses_build_es_query_search_by_match_text(self):
        """
        Happy path: build a query that filters courses by matching text
        """
        form = CoursesIndexer.form(
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
