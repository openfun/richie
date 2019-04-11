"""
Tests for the course viewset
"""
from unittest import mock

from django.test import TestCase
from django.utils import timezone

import pytz
from elasticsearch.exceptions import NotFoundError
from rest_framework.test import APIRequestFactory

from richie.apps.search import ES_CLIENT
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.viewsets.courses import CoursesViewSet


# Patch the formatter once so we can keep our tests focused on what we're actually testing
# and avoid the distraction of passing around full-featured records.
@mock.patch.object(
    CoursesIndexer,
    "format_es_object_for_api",
    side_effect=lambda es_course: "Course #{:n}".format(es_course["_id"]),
)
class CoursesViewsetsTestCase(TestCase):
    """
    Test the API endpoints for courses (list and details)
    """

    def setUp(self):
        """
        Make sure all our tests are timezone-agnostic. Some of them parse ISO datetimes and those
        would be broken if we did not enforce timezone normalization.
        """
        timezone.activate(pytz.utc)

    def test_viewsets_courses_retrieve(self, *_):
        """
        Happy path: the client requests an existing course, gets it back
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/courses/42")

        with mock.patch.object(ES_CLIENT, "get", return_value={"_id": 42}):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = CoursesViewSet.as_view({"get": "retrieve"})(
                request, 42, version="1.0"
            )

        # The client received a proper response with the relevant course
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, "Course #42")

    def test_viewsets_courses_retrieve_unknown(self, *_):
        """
        Error case: the client is asking for a course that does not exist
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/courses/43")

        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(ES_CLIENT, "get", side_effect=NotFoundError):
            response = CoursesViewSet.as_view({"get": "retrieve"})(
                request, 43, version="1.0"
            )

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @mock.patch(
        "richie.apps.search.forms.CourseSearchForm.build_es_query",
        lambda *args: (2, 77, {"some": "query"}, {"some": "aggs"}),
    )
    @mock.patch(
        "richie.apps.search.forms.CourseSearchForm.get_sorting_script",
        lambda *args: {"some": "sorting"},
    )
    @mock.patch(
        "richie.apps.search.forms.CourseSearchForm.get_script_fields",
        lambda *args: {"some": "fields"},
    )
    @mock.patch.object(ES_CLIENT, "search")
    def test_viewsets_courses_search(self, mock_search, *_):
        """
        Happy path: the consumer is filtering courses by matching text
        """
        factory = APIRequestFactory()
        request = factory.get(
            "/api/v1.0/courses?query=some%20phrase%20terms&limit=2&offset=20"
        )

        # We use a mock implementation instead of return_value as a pragmatic way to get results
        # from the whole filters pipeline without having to mock too many things.
        # pylint: disable=inconsistent-return-statements
        def mock_search_implementation(index, **_):
            if index == "richie_courses":
                return {
                    "hits": {"hits": [{"_id": 523}, {"_id": 861}], "total": 35},
                    "aggregations": {
                        "all_courses": {
                            "availability@archived": {"doc_count": 11},
                            "availability@coming_soon": {"doc_count": 8},
                            "availability@ongoing": {"doc_count": 42},
                            "availability@open": {"doc_count": 59},
                            "languages@en": {"doc_count": 33},
                            "languages@fr": {"doc_count": 55},
                            "new@new": {"doc_count": 66},
                            "levels": {
                                "levels": {
                                    "buckets": [
                                        {"key": "2", "doc_count": 15},
                                        {"key": "1", "doc_count": 13},
                                    ]
                                }
                            },
                            "organizations": {
                                "organizations": {
                                    "buckets": [
                                        {"key": "12", "doc_count": 19},
                                        {"key": "11", "doc_count": 17},
                                    ]
                                }
                            },
                            "subjects": {
                                "subjects": {
                                    "buckets": [
                                        {"key": "22", "doc_count": 23},
                                        {"key": "21", "doc_count": 21},
                                    ]
                                }
                            },
                        }
                    },
                }
            if index == "richie_categories":
                return {
                    "hits": {
                        "hits": [
                            {"_id": "1", "_source": {"title": {"en": "Level 1"}}},
                            {"_id": "2", "_source": {"title": {"en": "Level 2"}}},
                            {"_id": "21", "_source": {"title": {"en": "Subject 1"}}},
                            {"_id": "22", "_source": {"title": {"en": "Subject 2"}}},
                        ]
                    }
                }
            if index == "richie_organizations":
                return {
                    "hits": {
                        "hits": [
                            {
                                "_id": "11",
                                "_source": {"title": {"en": "Organization 11"}},
                            },
                            {
                                "_id": "12",
                                "_source": {"title": {"en": "Organization 12"}},
                            },
                        ]
                    }
                }

        mock_search.side_effect = mock_search_implementation

        response = CoursesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 77, "total_count": 35},
                "objects": ["Course #523", "Course #861"],
                "filters": {
                    "availability": {
                        "human_name": "Availability",
                        "is_drilldown": True,
                        "name": "availability",
                        "position": 1,
                        "values": [
                            {
                                "count": 59,
                                "human_name": "Open for enrollment",
                                "key": "open",
                            },
                            {
                                "count": 8,
                                "human_name": "Coming soon",
                                "key": "coming_soon",
                            },
                            {"count": 42, "human_name": "On-going", "key": "ongoing"},
                            {"count": 11, "human_name": "Archived", "key": "archived"},
                        ],
                    },
                    "new": {
                        "human_name": "New courses",
                        "is_drilldown": False,
                        "name": "new",
                        "position": 0,
                        "values": [
                            {"count": 66, "human_name": "First session", "key": "new"}
                        ],
                    },
                    "subjects": {
                        "base_path": None,
                        "human_name": "Subjects",
                        "is_drilldown": False,
                        "name": "subjects",
                        "position": 2,
                        "values": [
                            {"count": 23, "human_name": "Subject 2", "key": "22"},
                            {"count": 21, "human_name": "Subject 1", "key": "21"},
                        ],
                    },
                    "levels": {
                        "base_path": None,
                        "human_name": "Levels",
                        "is_drilldown": False,
                        "name": "levels",
                        "position": 3,
                        "values": [
                            {"count": 15, "human_name": "Level 2", "key": "2"},
                            {"count": 13, "human_name": "Level 1", "key": "1"},
                        ],
                    },
                    "organizations": {
                        "base_path": None,
                        "human_name": "Organizations",
                        "is_drilldown": False,
                        "name": "organizations",
                        "position": 4,
                        "values": [
                            {"count": 19, "human_name": "Organization 12", "key": "12"},
                            {"count": 17, "human_name": "Organization 11", "key": "11"},
                        ],
                    },
                    "languages": {
                        "human_name": "Languages",
                        "is_drilldown": False,
                        "name": "languages",
                        "position": 5,
                        "values": [
                            {"count": 55, "human_name": "French", "key": "fr"},
                            {"count": 33, "human_name": "English", "key": "en"},
                        ],
                    },
                },
            },
        )
        # The ES connector was called with appropriate arguments for the client's request
        mock_search.assert_any_call(
            _source=[
                "absolute_url",
                "categories",
                "cover_image",
                "organizations",
                "title.*",
            ],
            body={
                "aggs": {"some": "aggs"},
                "query": {"some": "query"},
                "script_fields": {"some": "fields"},
                "sort": {"some": "sorting"},
            },
            doc_type="course",
            from_=77,
            index="richie_courses",
            size=2,
        )

    def test_viewsets_courses_search_with_invalid_params(self, *_):
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
