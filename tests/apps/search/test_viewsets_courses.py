"""
Tests for the course viewset
"""
import datetime
import json
from unittest import mock

from django.conf import settings
from django.test import TestCase
from django.utils import timezone

import pytz
from elasticsearch.exceptions import NotFoundError
from rest_framework.test import APIRequestFactory

from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.viewsets.courses import CoursesViewSet


# Patch the formatter once so we can keep our tests focused on what we're actually testing
# and avoid the distraction of passing around full-featured records.
@mock.patch.object(
    CoursesIndexer,
    "format_es_course_for_api",
    side_effect=lambda es_course, _: "Course #{:n}".format(es_course["_id"]),
)
class CoursesViewsetTestCase(TestCase):
    """
    Test the API endpoints for courses (list and details)
    """

    def setUp(self):
        """
        Make sure all our tests are timezone-agnostic. Some of them parse ISO datetimes and those
        would be broken if we did not enforce timezone normalization.
        """
        timezone.activate(pytz.utc)

    def test_retrieve_course(self, *_):
        """
        Happy path: the client requests an existing course, gets it back
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/courses/42")

        with mock.patch.object(settings.ES_CLIENT, "get", return_value={"_id": 42}):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = CoursesViewSet.as_view({"get": "retrieve"})(
                request, 42, version="1.0"
            )

        # The client received a proper response with the relevant course
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, "Course #42")

    def test_retrieve_unknown_course(self, *_):
        """
        Error case: the client is asking for a course that does not exist
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/courses/43")

        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(settings.ES_CLIENT, "get", side_effect=NotFoundError):
            response = CoursesViewSet.as_view({"get": "retrieve"})(
                request, 43, version="1.0"
            )

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_search_all_courses(self, mock_search, *_):
        """
        Happy path: the consumer is not filtering the courses at all
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/courses?limit=2&offset=10")

        mock_search.return_value = {
            "hits": {"hits": [{"_id": 89}, {"_id": 94}], "total": 90},
            "aggregations": {
                "all_courses": {
                    "organizations": {
                        "organizations": {
                            "buckets": [
                                {"key": "1", "doc_count": 7},
                                {"key": "2", "doc_count": 9},
                            ]
                        }
                    }
                }
            },
        }

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 10, "total_count": 90},
                "objects": ["Course #89", "Course #94"],
                "facets": {"organizations": {"1": 7, "2": 9}},
            },
        )
        # The ES connector was called with appropriate arguments for the client's request
        mock_search.assert_called_with(
            body={
                "aggs": {
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
                "query": {"match_all": {}},
            },
            doc_type="course",
            from_=10,
            index="richie_courses",
            size=2,
        )

    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_search_courses_by_match_text(self, mock_search, *_):
        """
        Happy path: the consumer is filtering courses by matching text
        """
        factory = APIRequestFactory()
        request = factory.get(
            "/api/v1.0/courses?query=some%20phrase%20terms&limit=2&offset=20"
        )

        mock_search.return_value = {
            "hits": {"hits": [{"_id": 523}, {"_id": 861}], "total": 35},
            "aggregations": {
                "all_courses": {
                    "subjects": {
                        "subjects": {
                            "buckets": [
                                {"key": "11", "doc_count": 17},
                                {"key": "21", "doc_count": 19},
                            ]
                        }
                    }
                }
            },
        }

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 20, "total_count": 35},
                "objects": ["Course #523", "Course #861"],
                "facets": {"subjects": {"11": 17, "21": 19}},
            },
        )
        # The ES connector was called with appropriate arguments for the client's request
        multi_match = {
            "multi_match": {
                "fields": ["short_description.*", "title.*"],
                "query": "some phrase terms",
                "type": "cross_fields",
            }
        }
        mock_search.assert_called_with(
            body={
                "aggs": {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
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
                "query": {
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
            },
            doc_type="course",
            from_=20,
            index="richie_courses",
            size=2,
        )

    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_search_courses_by_terms_organizations(self, mock_search, *_):
        """
        Happy path: the consumer is filtering courses by organization ID
        """
        factory = APIRequestFactory()
        request = factory.get(
            "/api/v1.0/courses?organizations=13&organizations=15&limit=2"
        )

        mock_search.return_value = {
            "hits": {"hits": [{"_id": 221}, {"_id": 42}], "total": 29},
            "aggregations": {
                "all_courses": {
                    "organizations": {
                        "organizations": {
                            "buckets": [
                                {"key": "13", "doc_count": 21},
                                {"key": "15", "doc_count": 13},
                            ]
                        }
                    },
                    "subjects": {
                        "subjects": {
                            "buckets": [
                                {"key": "12", "doc_count": 3},
                                {"key": "22", "doc_count": 5},
                            ]
                        }
                    },
                }
            },
        }

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 29},
                "objects": ["Course #221", "Course #42"],
                "facets": {
                    "organizations": {"13": 21, "15": 13},
                    "subjects": {"12": 3, "22": 5},
                },
            },
        )
        # The ES connector was called with appropriate arguments for the client's request
        terms_organizations = {"terms": {"organizations": [13, 15]}}
        mock_search.assert_called_with(
            body={
                "aggs": {
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
                                "filter": {"bool": {"must": [terms_organizations]}},
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
                "query": {"bool": {"must": [terms_organizations]}},
            },
            doc_type="course",
            from_=0,
            index="richie_courses",
            size=2,
        )

    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_search_courses_by_single_term_organizations(self, mock_search, *_):
        """
        Happy path: make sure a single term (eg. subject or organization) which should be
        valid, is accepted (added after catching an error during manual testing)
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/courses?organizations=345&limit=2")

        mock_search.return_value = {
            "hits": {"hits": [{"_id": 37}, {"_id": 98}], "total": 12},
            "aggregations": {
                "all_courses": {
                    "organizations": {
                        "organizations": {
                            "buckets": [
                                {"key": "3", "doc_count": 6},
                                {"key": "14", "doc_count": 7},
                            ]
                        }
                    }
                }
            },
        }

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 12},
                "objects": ["Course #37", "Course #98"],
                "facets": {"organizations": {"3": 6, "14": 7}},
            },
        )
        # The ES connector was called with appropriate arguments for the client's request
        term_organization = {"terms": {"organizations": [345]}}
        mock_search.assert_called_with(
            body={
                "aggs": {
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
                                "filter": {"bool": {"must": [term_organization]}},
                                "aggregations": {
                                    "subjects": {"terms": {"field": "subjects"}}
                                },
                            },
                        },
                    }
                },
                "query": {"bool": {"must": [term_organization]}},
            },
            doc_type="course",
            from_=0,
            index="richie_courses",
            size=2,
        )

    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_search_courses_by_range_datetimes(self, mock_search, *_):
        """
        Happy path: the consumer is filtering courses using datetimes
        """
        factory = APIRequestFactory()

        start_date = json.dumps(["2018-01-01T06:00:00Z", None])
        end_date = json.dumps(["2018-04-30T06:00:00Z", "2018-06-30T06:00:00Z"])
        request = factory.get(
            "/api/v1.0/courses?start_date={start_date}&end_date={end_date}&limit=2".format(
                start_date=start_date, end_date=end_date
            )
        )

        mock_search.return_value = {
            "hits": {"hits": [{"_id": 13}, {"_id": 15}], "total": 7},
            "aggregations": {
                "all_courses": {
                    "subjects": {
                        "subjects": {
                            "buckets": [
                                {"key": "61", "doc_count": 4},
                                {"key": "122", "doc_count": 5},
                            ]
                        }
                    }
                }
            },
        }

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 7},
                "objects": ["Course #13", "Course #15"],
                "facets": {"subjects": {"61": 4, "122": 5}},
            },
        )
        # The ES connector was called with appropriate arguments for the client's request
        range_end_date = {
            "range": {
                "end_date": {
                    "gte": datetime.datetime(2018, 4, 30, 6, 0, tzinfo=pytz.utc),
                    "lte": datetime.datetime(2018, 6, 30, 6, 0, tzinfo=pytz.utc),
                }
            }
        }
        range_start_date = {
            "range": {
                "start_date": {
                    "gte": datetime.datetime(2018, 1, 1, 6, 0, tzinfo=pytz.utc),
                    "lte": None,
                }
            }
        }
        mock_search.assert_called_with(
            body={
                "aggs": {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
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
                "query": {"bool": {"must": [range_end_date, range_start_date]}},
            },
            doc_type="course",
            from_=0,
            index="richie_courses",
            size=2,
        )

    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_combined_search_courses(self, mock_search, *_):
        """
        Happy path: the consumer is using several filters at the same time
        """
        factory = APIRequestFactory()

        start_date = json.dumps(["2018-01-01T06:00:00Z", None])
        end_date = json.dumps(["2018-04-30T06:00:00Z", "2018-06-30T06:00:00Z"])

        request = factory.get(
            "/api/v1.0/courses?subjects=42&subjects=84&query=these%20phrase%20terms&limit=2&"
            + "start_date={start_date}&end_date={end_date}".format(
                start_date=start_date, end_date=end_date
            )
        )

        mock_search.return_value = {
            "hits": {"hits": [{"_id": 999}, {"_id": 888}], "total": 3},
            "aggregations": {
                "all_courses": {
                    "subjects": {
                        "subjects": {
                            "buckets": [
                                {"key": "42", "doc_count": 3},
                                {"key": "84", "doc_count": 1},
                            ]
                        }
                    }
                }
            },
        }

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 3},
                "objects": ["Course #999", "Course #888"],
                "facets": {"subjects": {"42": 3, "84": 1}},
            },
        )
        # The ES connector was called with appropriate arguments for the client's request
        range_end_date = {
            "range": {
                "end_date": {
                    "gte": datetime.datetime(2018, 4, 30, 6, 0, tzinfo=pytz.utc),
                    "lte": datetime.datetime(2018, 6, 30, 6, 0, tzinfo=pytz.utc),
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
                    "gte": datetime.datetime(2018, 1, 1, 6, 0, tzinfo=pytz.utc),
                    "lte": None,
                }
            }
        }
        terms_subjects = {"terms": {"subjects": [42, 84]}}
        mock_search.assert_called_with(
            body={
                "aggs": {
                    "all_courses": {
                        "global": {},
                        "aggregations": {
                            "organizations": {
                                "filter": {
                                    "bool": {
                                        "must": [
                                            range_end_date,
                                            multi_match,
                                            range_start_date,
                                            terms_subjects,
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
                "query": {
                    "bool": {
                        "must": [
                            range_end_date,
                            multi_match,
                            range_start_date,
                            terms_subjects,
                        ]
                    }
                },
            },
            doc_type="course",
            from_=0,
            index="richie_courses",
            size=2,
        )

    def test_search_courses_with_invalid_params(self, *_):
        """
        Error case: the query string params are not properly formatted
        """
        factory = APIRequestFactory()
        # The request contains incorrect params: limit should be an integer, not a string
        request = factory.get("/api/v1.0/courses?limit=fail")

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
