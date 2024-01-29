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
                "facet_sorting": "",
                "languages": [],
                "levels": [],
                "levels_aggs": [],
                "levels_children_aggs": "",
                "licences": [],
                "licences_aggs": [],
                "licences_children_aggs": "",
                "limit": None,
                "new": [],
                "offset": None,
                "organizations": [],
                "organizations_aggs": [],
                "organizations_children_aggs": "",
                "persons": [],
                "persons_aggs": [],
                "persons_children_aggs": "",
                "query": "",
                "pace": [],
                "scope": "",
                "subjects": [],
                "subjects_aggs": [],
                "subjects_children_aggs": "",
            },
        )

    def test_forms_courses_facet_sorting_among_choices(self, *_):
        """The `facet_sorting` param should be one of the available choices."""
        form = CourseSearchForm(data=QueryDict(query_string="facet_sorting=none"))
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "facet_sorting": [
                    "Select a valid choice. none is not one of the available choices."
                ]
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

        form = CourseSearchForm(data=QueryDict(query_string=f"query={'a' * 100:s}"))
        self.assertTrue(form.is_valid())

        form = CourseSearchForm(data=QueryDict(query_string=f"query={'a' * 101:s}"))
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
                    "availability=coming_soon"
                    "&facet_sorting=count"
                    "&languages=fr"
                    "&levels=1"
                    "&limit=9"
                    "&new=new"
                    "&offset=3"
                    "&organizations=10"
                    "&query=maths"
                    "&scope=objects"
                    "&subjects=1"
                )
            )
        )
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": ["coming_soon"],
                "facet_sorting": "count",
                "languages": ["fr"],
                "levels": ["1"],
                "levels_aggs": [],
                "levels_children_aggs": "",
                "licences": [],
                "licences_aggs": [],
                "licences_children_aggs": "",
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10"],
                "organizations_aggs": [],
                "organizations_children_aggs": "",
                "persons": [],
                "persons_aggs": [],
                "persons_children_aggs": "",
                "query": "maths",
                "pace": [],
                "scope": "objects",
                "subjects": ["1"],
                "subjects_aggs": [],
                "subjects_children_aggs": "",
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
                    "availability=coming_soon"
                    "&availability=ongoing"
                    "&facet_sorting=name"
                    "&languages=fr"
                    "&languages=en"
                    "&levels=1"
                    "&levels=2"
                    "&levels_aggs=33"
                    "&levels_aggs=34"
                    "&limit=9"
                    "&limit=11"
                    "&new=new"
                    "&offset=3"
                    "&offset=17"
                    "&organizations=10"
                    "&organizations=11"
                    "&organizations_aggs=43"
                    "&organizations_aggs=44"
                    "&query=maths"
                    "&query=physics"
                    "&scope=objects"
                    "&scope=filters"
                    "&subjects=1"
                    "&subjects=2"
                    "&subjects_aggs=89"
                )
            )
        )
        form.is_valid()
        self.assertTrue(form.is_valid())
        self.assertEqual(
            form.cleaned_data,
            {
                "availability": ["coming_soon", "ongoing"],
                "facet_sorting": "name",
                "languages": ["fr", "en"],
                "levels": ["1", "2"],
                "levels_aggs": ["33", "34"],
                "levels_children_aggs": "",
                "licences": [],
                "licences_aggs": [],
                "licences_children_aggs": "",
                "limit": 9,
                "new": ["new"],
                "offset": 3,
                "organizations": ["10", "11"],
                "organizations_aggs": ["43", "44"],
                "organizations_children_aggs": "",
                "persons": [],
                "persons_aggs": [],
                "persons_children_aggs": "",
                "query": "maths",
                "pace": [],
                "scope": "objects",
                "subjects": ["1", "2"],
                "subjects_aggs": ["89"],
                "subjects_children_aggs": "",
            },
        )

    def test_forms_courses_build_es_query_search_by_match_text(self, *_):
        """
        Happy path: build a query that filters courses by matching text. A filter to
        include only listed courses should be added to both query and aggregations.
        """
        form = CourseSearchForm(
            data=QueryDict(query_string="limit=2&offset=20&query=some%20phrase%20terms")
        )
        self.assertTrue(form.is_valid())
        es_query = form.build_es_query()
        query = es_query[2]
        aggs = es_query[3]

        # Query should include only listed courses
        self.assertEqual(
            query["function_score"]["query"],
            {
                "bool": {
                    "must": [
                        {"term": {"is_listed": True}},
                        {
                            "bool": {
                                "should": [
                                    {
                                        "multi_match": {
                                            "analyzer": "english",
                                            "fields": [
                                                "description.*",
                                                "introduction.*",
                                                "title.*^50",
                                                "categories_names.*^0.05",
                                                "organizations_names.*^0.05",
                                                "persons_names.*^0.05",
                                            ],
                                            "query": "some phrase terms",
                                            "type": "best_fields",
                                        }
                                    },
                                    {
                                        "match": {
                                            "code": {
                                                "query": "some phrase terms",
                                                "analyzer": "code",
                                                "boost": 3000,
                                            }
                                        }
                                    },
                                    {
                                        "match": {
                                            "code": {
                                                "query": "some phrase terms",
                                                "analyzer": "code",
                                                "fuzziness": "AUTO",
                                            }
                                        }
                                    },
                                ]
                            }
                        },
                    ],
                }
            },
        )

        # All aggregations should include only listed courses
        for agg in list(aggs["all_courses"]["aggregations"].values()):
            self.assertTrue(
                {"term": {"is_listed": True}} in agg["filter"]["bool"]["must"]
            )
