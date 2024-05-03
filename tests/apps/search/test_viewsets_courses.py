"""
Tests for the course viewset
"""

from datetime import timezone
from unittest import mock

from django.test.utils import override_settings
from django.utils import timezone as django_timezone

from cms.test_utils.testcases import CMSTestCase
from elasticsearch.exceptions import NotFoundError

from richie.apps.search import ES_CLIENT
from richie.apps.search.indexers.courses import CoursesIndexer


# Patch the formatter once so we can keep our tests focused on what we're actually testing
# and avoid the distraction of passing around full-featured records.
@mock.patch.object(
    CoursesIndexer,
    "format_es_object_for_api",
    side_effect=lambda es_course: f"Course #{es_course['_id']:n}",
)
class CoursesViewsetsTestCase(CMSTestCase):
    """
    Test the API endpoints for courses (list and details)
    """

    def setUp(self):
        """
        Make sure all our tests are timezone-agnostic. Some of them parse ISO datetimes and those
        would be broken if we did not enforce timezone normalization.
        """
        super().setUp()
        django_timezone.activate(timezone.utc)

    def test_viewsets_courses_retrieve(self, *_):
        """
        Happy path: the client requests an existing course, gets it back
        """
        with mock.patch.object(ES_CLIENT, "get", return_value={"_id": 42}):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = self.client.get("/api/v1.0/courses/42/")

        # The client received a proper response with the relevant course
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, "Course #42")

    def test_viewsets_courses_retrieve_unknown(self, *_):
        """
        Error case: the client is asking for a course that does not exist
        """
        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(ES_CLIENT, "get", side_effect=NotFoundError):
            response = self.client.get("/api/v1.0/courses/43/", follow=True)

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @override_settings(RICHIE_ES_INDICES_PREFIX="richie")
    @mock.patch(
        "richie.apps.search.forms.CourseSearchForm.build_es_query",
        lambda *args: (2, 77, {"some": "query"}, {"some": "aggs"}),
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

        # We use a mock implementation instead of return_value as a pragmatic way to get results
        # from the whole filters pipeline without having to mock too many things.
        # pylint: disable=inconsistent-return-statements
        def mock_search_implementation(index, **_):
            if index == "richie_courses":
                return {
                    "hits": {
                        "hits": [{"_id": 523}, {"_id": 861}],
                        "total": {"value": 35, "relation": "eq"},
                    },
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
                            "licences": {
                                "licences": {
                                    "buckets": [
                                        {"key": "41", "doc_count": 13},
                                        {"key": "42", "doc_count": 66},
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
                            "persons": {
                                "persons": {
                                    "buckets": [
                                        {"key": "31", "doc_count": 11},
                                        {"key": "32", "doc_count": 7},
                                        {"key": "33", "doc_count": 3},
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
            if index == "richie_licences":
                return {
                    "hits": {
                        "hits": [
                            {"_id": "41", "_source": {"title": {"en": "Licence 41"}}},
                            {"_id": "42", "_source": {"title": {"en": "Licence 42"}}},
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
            if index == "richie_persons":
                return {
                    "hits": {
                        "hits": [
                            {"_id": "31", "_source": {"title": {"en": "Person 31"}}},
                            {"_id": "32", "_source": {"title": {"en": "Person 32"}}},
                            {"_id": "33", "_source": {"title": {"en": "Person 33"}}},
                        ]
                    }
                }

        mock_search.side_effect = mock_search_implementation

        response = self.client.get(
            "/api/v1.0/courses/?query=some%20phrase%20terms&limit=2&offset=20"
        )

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 77, "total_count": 35},
                "objects": ["Course #523", "Course #861"],
                "filters": {
                    "availability": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Availability",
                        "is_autocompletable": False,
                        "is_drilldown": True,
                        "is_searchable": False,
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
                    "languages": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Languages",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "languages",
                        "position": 5,
                        "values": [
                            {"count": 55, "human_name": "French", "key": "fr"},
                            {"count": 33, "human_name": "English", "key": "en"},
                        ],
                    },
                    "levels": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Levels",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "levels",
                        "position": 3,
                        "values": [
                            {"count": 15, "human_name": "Level 2", "key": "2"},
                            {"count": 13, "human_name": "Level 1", "key": "1"},
                        ],
                    },
                    "licences": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Licences",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "licences",
                        "position": 7,
                        "values": [
                            {"count": 66, "human_name": "Licence 42", "key": "42"},
                            {"count": 13, "human_name": "Licence 41", "key": "41"},
                        ],
                    },
                    "new": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "New courses",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "new",
                        "position": 0,
                        "values": [
                            {"count": 66, "human_name": "First session", "key": "new"}
                        ],
                    },
                    "organizations": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Organizations",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "organizations",
                        "position": 4,
                        "values": [
                            {"count": 19, "human_name": "Organization 12", "key": "12"},
                            {"count": 17, "human_name": "Organization 11", "key": "11"},
                        ],
                    },
                    "persons": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Persons",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "persons",
                        "position": 6,
                        "values": [
                            {"count": 11, "human_name": "Person 31", "key": "31"},
                            {"count": 7, "human_name": "Person 32", "key": "32"},
                            {"count": 3, "human_name": "Person 33", "key": "33"},
                        ],
                    },
                    "pace": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Weekly pace",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "pace",
                        "position": 8,
                        "values": [],
                    },
                    "subjects": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Subjects",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "subjects",
                        "position": 2,
                        "values": [
                            {"count": 23, "human_name": "Subject 2", "key": "22"},
                            {"count": 21, "human_name": "Subject 1", "key": "21"},
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
                "code",
                "course_runs",
                "cover_image",
                "duration",
                "effort",
                "icon",
                "introduction",
                "organization_highlighted",
                "organization_highlighted_cover_image",
                "organizations",
                "title",
            ],
            body={
                "aggs": {"some": "aggs"},
                "query": {"some": "query"},
                "script_fields": {"some": "fields"},
            },
            from_=77,
            index="richie_courses",
            size=2,
        )

    def test_viewsets_courses_search_with_invalid_params(self, *_):
        """
        Error case: the query string params are not properly formatted
        """
        # The request contains incorrect params: limit should be an integer, not a string
        response = self.client.get("/api/v1.0/courses/?limit=fail")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
