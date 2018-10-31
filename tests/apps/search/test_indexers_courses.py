"""
Tests for the course indexer
"""
# pylint: disable=too-many-lines
import json
import uuid
from types import SimpleNamespace
from unittest.mock import patch

from django.conf import settings
from django.forms import ChoiceField, MultipleChoiceField
from django.http.request import QueryDict
from django.test import TestCase

import arrow
import responses
from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.search.exceptions import IndexerDataException, QueryFormatException
from richie.apps.search.indexers.courses import CoursesIndexer


class CoursesIndexersTestCase(TestCase):
    """
    Test the get_data_for_es() function on the course indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @responses.activate
    def test_indexers_courses_get_data_for_es(self):
        """
        Happy path: the data is fetched from the API properly formatted
        """
        responses.add(
            method="GET",
            url=settings.COURSE_API_ENDPOINT + "?page=1&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {
                        "end_date": "2018-02-28T06:00:00Z",
                        "enrollment_end_date": "2018-01-31T06:00:00Z",
                        "enrollment_start_date": "2018-01-01T06:00:00Z",
                        "id": 42,
                        "language": "fr",
                        "main_university": {"id": 21},
                        "session_number": 6,
                        "short_description": "Lorem ipsum dolor sit amet",
                        "start_date": "2018-02-01T06:00:00Z",
                        "subjects": [{"id": 168}, {"id": 336}],
                        "thumbnails": {"big": "whatever.png"},
                        "title": "A course in filler text",
                        "universities": [{"id": 21}, {"id": 84}],
                    }
                ],
            },
        )

        responses.add(
            method="GET",
            url=settings.COURSE_API_ENDPOINT + "?page=2&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {
                        "end_date": "2019-02-28T06:00:00Z",
                        "enrollment_end_date": "2019-01-31T06:00:00Z",
                        "enrollment_start_date": "2019-01-01T06:00:00Z",
                        "id": 44,
                        "language": "en",
                        "main_university": {"id": 22},
                        "session_number": 1,
                        "short_description": "Consectetur adipiscim elit",
                        "start_date": "2019-02-01T06:00:00Z",
                        "subjects": [{"id": 176}, {"id": 352}],
                        "thumbnails": {"big": "whatever_else.png"},
                        "title": "Filler text 102",
                        "universities": [{"id": 22}, {"id": 88}],
                    }
                ],
            },
        )

        # The results were properly formatted and passed to the consumer
        self.assertEqual(
            list(
                CoursesIndexer.get_data_for_es(index="some_index", action="some_action")
            ),
            [
                {
                    "_id": 42,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "course",
                    "end_date": "2018-02-28T06:00:00Z",
                    "enrollment_end_date": "2018-01-31T06:00:00Z",
                    "enrollment_start_date": "2018-01-01T06:00:00Z",
                    "language": "fr",
                    "organization_main": 21,
                    "organizations": [21, 84],
                    "session_number": 6,
                    "short_description": {"fr": "Lorem ipsum dolor sit amet"},
                    "start_date": "2018-02-01T06:00:00Z",
                    "subjects": [168, 336],
                    "thumbnails": {"big": "whatever.png"},
                    "title": {"fr": "A course in filler text"},
                },
                {
                    "_id": 44,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "course",
                    "end_date": "2019-02-28T06:00:00Z",
                    "enrollment_end_date": "2019-01-31T06:00:00Z",
                    "enrollment_start_date": "2019-01-01T06:00:00Z",
                    "language": "en",
                    "organization_main": 22,
                    "organizations": [22, 88],
                    "session_number": 1,
                    "short_description": {"en": "Consectetur adipiscim elit"},
                    "start_date": "2019-02-01T06:00:00Z",
                    "subjects": [176, 352],
                    "thumbnails": {"big": "whatever_else.png"},
                    "title": {"en": "Filler text 102"},
                },
            ],
        )

    @responses.activate
    def test_indexers_courses_get_data_for_es_with_unexpected_data_shape(self):
        """
        Error case: the API returned an object that is not shape like an expected course
        """
        responses.add(
            method="GET",
            url=settings.COURSE_API_ENDPOINT,
            status=200,
            json={
                "count": 1,
                "results": [
                    {
                        "end_date": "2018-02-28T06:00:00Z",
                        "enrollment_end_date": "2018-01-31T06:00:00Z",
                        "enrollment_start_date": "2018-01-01T06:00:00Z",
                        "id": 42,
                        # 'language': 'fr', missing language key will trigger the KeyError
                        "main_university": {"id": 21},
                        "session_number": 6,
                        "short_description": "Lorem ipsum dolor sit amet",
                        "start_date": "2018-02-01T06:00:00Z",
                        "subjects": [{"id": 168}, {"id": 336}],
                        "thumbnails": {"big": "whatever.png"},
                        "title": "A course in filler text",
                        "universities": [{"id": 21}, {"id": 84}],
                    }
                ],
            },
        )

        with self.assertRaises(IndexerDataException):
            list(
                CoursesIndexer.get_data_for_es(index="some_index", action="some_action")
            )

    def test_indexers_courses_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted course
        """
        es_course = {
            "_id": 93,
            "_source": {
                "end_date": "2018-02-28T06:00:00Z",
                "enrollment_end_date": "2018-01-31T06:00:00Z",
                "enrollment_start_date": "2018-01-01T06:00:00Z",
                "language": "en",
                "organization_main": 42,
                "organizations": [42, 84],
                "session_number": 1,
                "short_description": {
                    "en": "Nam aliquet, arcu at sagittis sollicitudin."
                },
                "start_date": "2018-02-01T06:00:00Z",
                "subjects": [43, 86],
                "thumbnails": {"big": "whatever_else.png"},
                "title": {"en": "Duis eu arcu erat"},
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_object_for_api(es_course, "en"),
            {
                "end_date": "2018-02-28T06:00:00Z",
                "enrollment_end_date": "2018-01-31T06:00:00Z",
                "enrollment_start_date": "2018-01-01T06:00:00Z",
                "id": 93,
                "language": "en",
                "organization_main": 42,
                "organizations": [42, 84],
                "session_number": 1,
                "short_description": "Nam aliquet, arcu at sagittis sollicitudin.",
                "start_date": "2018-02-01T06:00:00Z",
                "subjects": [43, 86],
                "thumbnails": {"big": "whatever_else.png"},
                "title": "Duis eu arcu erat",
            },
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "language": {
                "choices": {
                    lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]
                },
                "field": MultipleChoiceField,
            }
        },
    )
    def test_indexers_courses_build_es_query_search_all_courses(self):
        """
        Happy path: build a query that does not filter the courses at all
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(query_string="limit=2&offset=10")
        )
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                2,
                10,
                {"match_all": {}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "language@en": {
                                "filter": {
                                    "bool": {"must": [{"term": {"language": "en"}}]}
                                }
                            },
                            "language@fr": {
                                "filter": {
                                    "bool": {"must": [{"term": {"language": "fr"}}]}
                                }
                            },
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "language": {
                "choices": {
                    lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]
                },
                "field": ChoiceField,
            }
        },
    )
    def test_indexers_courses_build_es_query_search_by_match_text(self):
        """
        Happy path: build a query that filters courses by matching text
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="query=some%20phrase%20terms&limit=2&offset=20"
            )
        )
        multi_match = {
            "multi_match": {
                "fields": ["short_description.*", "title.*"],
                "query": "some phrase terms",
                "type": "cross_fields",
            }
        }
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                2,
                20,
                {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "fields": ["short_description.*", "title.*"],
                                    "query": "some phrase terms",
                                    "type": "cross_fields",
                                }
                            }
                        ]
                    }
                },
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "language@en": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "en"}},
                                            multi_match,
                                        ]
                                    }
                                }
                            },
                            "language@fr": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "fr"}},
                                            multi_match,
                                        ]
                                    }
                                }
                            },
                            "organizations": {
                                "filter": {"bool": {"must": [multi_match]}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {"bool": {"must": [multi_match]}},
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "language": {
                "choices": {
                    lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]
                },
                "field": MultipleChoiceField,
            }
        },
    )
    def test_indexers_courses_build_es_query_search_by_terms_organizations(self):
        """
        Happy path: build a query that filters courses by more than 1 related organizations
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="organizations=13&organizations=15&limit=2"
            )
        )
        terms_organizations = {"terms": {"organizations": [13, 15]}}
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                2,
                0,
                {"bool": {"must": [terms_organizations]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "language@en": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "en"}},
                                            terms_organizations,
                                        ]
                                    }
                                }
                            },
                            "language@fr": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "fr"}},
                                            terms_organizations,
                                        ]
                                    }
                                }
                            },
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {"bool": {"must": [terms_organizations]}},
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "language": {
                "choices": {
                    lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]
                },
                "field": ChoiceField,
            }
        },
    )
    def test_indexers_courses_build_es_query_search_by_single_term_organizations(self):
        """
        Happy path: build a query that filters courses by exactly 1 related organization
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(query_string="organizations=345&limit=2")
        )
        term_organization = {"terms": {"organizations": [345]}}
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                2,
                0,
                {"bool": {"must": [term_organization]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "language@en": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "en"}},
                                            term_organization,
                                        ]
                                    }
                                }
                            },
                            "language@fr": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "fr"}},
                                            term_organization,
                                        ]
                                    }
                                }
                            },
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {"bool": {"must": [term_organization]}},
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "language": {
                "choices": {
                    lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]
                },
                "field": MultipleChoiceField,
            }
        },
    )
    def test_indexers_courses_build_es_query_search_by_range_datetimes(self):
        """
        Happy path: build a query that filters courses by start & end date datetime ranges
        """
        # Build a request stub
        start_date = json.dumps(["2018-01-01T06:00:00Z", None])
        end_date = json.dumps(["2018-04-30T06:00:00Z", "2018-06-30T06:00:00Z"])
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="start_date={start_date}&end_date={end_date}".format(
                    start_date=start_date, end_date=end_date
                )
            )
        )
        range_end_date = {
            "range": {
                "end_date": {
                    "gte": arrow.get("2018-04-30T06:00:00Z").datetime,
                    "lte": arrow.get("2018-06-30T06:00:00Z").datetime,
                }
            }
        }
        range_start_date = {
            "range": {
                "start_date": {
                    "gte": arrow.get("2018-01-01T06:00:00Z").datetime,
                    "lte": None,
                }
            }
        }
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                None,
                0,
                {"bool": {"must": [range_end_date, range_start_date]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "language@en": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "en"}},
                                            range_end_date,
                                            range_start_date,
                                        ]
                                    }
                                }
                            },
                            "language@fr": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "fr"}},
                                            range_end_date,
                                            range_start_date,
                                        ]
                                    }
                                }
                            },
                            "organizations": {
                                "filter": {
                                    "bool": {"must": [range_end_date, range_start_date]}
                                },
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {
                                    "bool": {"must": [range_end_date, range_start_date]}
                                },
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "language": {
                "choices": {
                    lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]
                },
                "field": ChoiceField,
            },
            "new": {
                "choices": {"new": [{"term": {"session_number": 1}}]},
                "field": MultipleChoiceField,
            },
        },
    )
    def test_indexers_courses_build_es_query_search_by_custom_filter(self):
        """
        Happy path: build a query using custom filters
        Note: we're keeping fields from defaults.py instead of mocking for simplicity
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(query_string="limit=2&offset=10&language=fr")
        )
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                2,
                10,
                {"bool": {"must": [{"term": {"language": "fr"}}]}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "language@en": {
                                "filter": {
                                    "bool": {"must": [{"term": {"language": "en"}}]}
                                }
                            },
                            "language@fr": {
                                "filter": {
                                    "bool": {"must": [{"term": {"language": "fr"}}]}
                                }
                            },
                            "new@new": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"session_number": 1}},
                                            {"term": {"language": "fr"}},
                                        ]
                                    }
                                }
                            },
                            "organizations": {
                                "filter": {
                                    "bool": {"must": [{"term": {"language": "fr"}}]}
                                },
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {
                                    "bool": {"must": [{"term": {"language": "fr"}}]}
                                },
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    @patch(
        "richie.apps.search.indexers.courses.FILTERS_HARDCODED",
        new={
            "language": {
                "choices": {
                    lang: [{"term": {"language": lang}}] for lang in ["en", "fr"]
                },
                "field": MultipleChoiceField,
            },
            "new": {
                "choices": {"new": [{"term": {"session_number": 1}}]},
                "field": ChoiceField,
            },
        },
    )
    def test_indexers_courses_build_es_query_combined_search(self):
        """
        Happy path: build a query that filters courses by multiple filters, including a custom
        filter; make all aggs using all of those along with another custom filter
        """
        # Build a request stub
        start_date = json.dumps(["2018-01-01T06:00:00Z", None])
        end_date = json.dumps(["2018-04-30T06:00:00Z", "2018-06-30T06:00:00Z"])
        request = SimpleNamespace(
            query_params=QueryDict(
                query_string="subjects=42&subjects=84&query=these%20phrase%20terms&limit=2&"
                + "language=fr&"
                + "start_date={start_date}&end_date={end_date}".format(
                    start_date=start_date, end_date=end_date
                )
            )
        )
        range_end_date = {
            "range": {
                "end_date": {
                    "gte": arrow.get("2018-04-30T06:00:00Z").datetime,
                    "lte": arrow.get("2018-06-30T06:00:00Z").datetime,
                }
            }
        }
        multi_match = {
            "multi_match": {
                "fields": ["short_description.*", "title.*"],
                "query": "these phrase terms",
                "type": "cross_fields",
            }
        }
        range_start_date = {
            "range": {
                "start_date": {
                    "gte": arrow.get("2018-01-01T06:00:00Z").datetime,
                    "lte": None,
                }
            }
        }
        terms_subjects = {"terms": {"subjects": [42, 84]}}
        term_language_fr = {"term": {"language": "fr"}}
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                2,
                0,
                {
                    "bool": {
                        "must": [
                            range_end_date,
                            multi_match,
                            range_start_date,
                            terms_subjects,
                            term_language_fr,
                        ]
                    }
                },
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "language@en": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"language": "en"}},
                                            range_end_date,
                                            multi_match,
                                            range_start_date,
                                            terms_subjects,
                                        ]
                                    }
                                }
                            },
                            "language@fr": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            term_language_fr,
                                            range_end_date,
                                            multi_match,
                                            range_start_date,
                                            terms_subjects,
                                        ]
                                    }
                                }
                            },
                            "new@new": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            {"term": {"session_number": 1}},
                                            range_end_date,
                                            multi_match,
                                            range_start_date,
                                            terms_subjects,
                                            term_language_fr,
                                        ]
                                    }
                                }
                            },
                            "organizations": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            range_end_date,
                                            multi_match,
                                            range_start_date,
                                            terms_subjects,
                                            term_language_fr,
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            range_end_date,
                                            multi_match,
                                            range_start_date,
                                            term_language_fr,
                                        ]
                                    }
                                },
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    @patch("richie.apps.search.indexers.courses.FILTERS_HARDCODED", new={})
    def test_indexers_courses_build_es_query_search_with_empty_filters(self):
        """
        Edge case: custom filters have been removed entirely through settings
        """
        # Build a request stub
        request = SimpleNamespace(
            query_params=QueryDict(query_string="limit=20&offset=40")
        )
        self.assertEqual(
            CoursesIndexer.build_es_query(request),
            (
                20,
                40,
                {"match_all": {}},
                {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "organizations": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "organizations": {
                                        "terms": {"field": "organizations"}
                                    }
                                },
                            },
                            "subjects": {
                                "filter": {"bool": {"must": []}},
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
            ),
        )

    def test_indexers_courses_build_es_query_search_with_invalid_params(self):
        """
        Error case: the request contained invalid parameters
        """
        with self.assertRaises(QueryFormatException):
            CoursesIndexer.build_es_query(
                SimpleNamespace(query_params=QueryDict(query_string="limit=-2"))
            )

    def test_indexers_courses_list_sorting_script(self):
        """
        Make sure our courses list sorting script (Lucene expression) is working as intended
        """
        # Set up the index we'll use to run our test
        indices_client = IndicesClient(client=settings.ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_courses_list_sorting_index")
        # Use the default courses mapping from the Indexer for briefness' sake
        indices_client.put_mapping(
            body=CoursesIndexer.mapping,
            doc_type="courses",
            index="test_courses_list_sorting_index",
        )

        settings.ES_CLIENT.put_script(
            id="sort_list", body=CoursesIndexer.scripts["sort_list"]
        )

        # Add our sample of courses to the test index we just created
        # NB: we need to add 8 courses because we're splitting them into 4 buckets and
        # then using a specific ordering within each of these
        bulk(
            # NB: courses order & IDs have been voluntarily shuffled to ensure we don't
            # accidentally end up with the correct ordering if our sorting does not occur at all.
            actions=[
                {
                    # N. 3: not started yet, first upcoming course to start
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "4",
                    "end_date": arrow.utcnow().shift(days=+150).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=+30).isoformat(),
                    "start_date": arrow.utcnow().shift(days=+15).isoformat(),
                },
                {
                    # N. 1: ongoing course, next open course to end enrollment
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "3",
                    "end_date": arrow.utcnow().shift(days=+120).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=+5).isoformat(),
                    "start_date": arrow.utcnow().shift(days=-5).isoformat(),
                },
                {
                    # N. 7: the other already finished course; it finished more recently than N. 8
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "1",
                    "end_date": arrow.utcnow().shift(days=-15).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=-60).isoformat(),
                    "start_date": arrow.utcnow().shift(days=-80).isoformat(),
                },
                {
                    # N. 6: ongoing course, enrollment has been over for the longest
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "7",
                    "end_date": arrow.utcnow().shift(days=+30).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=-45).isoformat(),
                    "start_date": arrow.utcnow().shift(days=-75).isoformat(),
                },
                {
                    # N. 8: the course that has been over for the longest
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "5",
                    "end_date": arrow.utcnow().shift(days=-30).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=-90).isoformat(),
                    "start_date": arrow.utcnow().shift(days=-120).isoformat(),
                },
                {
                    # N. 4: not started yet, will start after the other upcoming course
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "8",
                    "end_date": arrow.utcnow().shift(days=+120).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=+60).isoformat(),
                    "start_date": arrow.utcnow().shift(days=+45).isoformat(),
                },
                {
                    # N. 2: ongoing course, can still be enrolled in for longer than N. 1
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "6",
                    "end_date": arrow.utcnow().shift(days=+105).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=+15).isoformat(),
                    "start_date": arrow.utcnow().shift(days=-15).isoformat(),
                },
                {
                    # N. 5: ongoing course, most recent to end enrollment
                    "_id": uuid.uuid4(),
                    "_index": "test_courses_list_sorting_index",
                    "_op_type": "create",
                    "_type": "courses",
                    "control_id": "2",
                    "end_date": arrow.utcnow().shift(days=+15).isoformat(),
                    "enrollment_end_date": arrow.utcnow().shift(days=-30).isoformat(),
                    "start_date": arrow.utcnow().shift(days=-90).isoformat(),
                },
            ],
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
        )

        indices_client.refresh()

        # Comparing lists of ids is enough to ensure proper ordering, as list comprehensions
        # explicitly preserve order
        self.assertEqual(
            [
                es_course["_source"]["control_id"]
                for es_course in settings.ES_CLIENT.search(
                    index="test_courses_list_sorting_index",
                    doc_type="courses",
                    body={
                        "query": {"match_all": {}},
                        "sort": CoursesIndexer.get_list_sorting_script(),
                    },
                    from_=0,
                    size=10,
                )["hits"]["hits"]
            ],
            ["3", "6", "4", "8", "2", "7", "1", "5"],
        )
