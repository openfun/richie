"""Tests for limits in facet counts in course searches."""
import json
from unittest import mock

from django.test import TestCase

from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.courses.factories import CategoryFactory
from richie.apps.search import ES_CLIENT
from richie.apps.search.filter_definitions import FILTERS, IndexableFilterDefinition
from richie.apps.search.filter_definitions.courses import ALL_LANGUAGES_DICT
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

SUBJECTS = [
    {"id": "L-00010001", "title": {"en": "Science"}},
    {"id": "L-00010002", "title": {"en": "Human and social sciences"}},
    {"id": "L-00010003", "title": {"en": "Law"}},
    {"id": "L-00010004", "title": {"en": "Economy and Finance"}},
    {"id": "L-00010005", "title": {"en": "Education and Training"}},
    {"id": "L-00010006", "title": {"en": "Management"}},
    {"id": "L-00010007", "title": {"en": "Entrepreneurship"}},
    {"id": "L-00010008", "title": {"en": "Computer science"}},
    {"id": "L-00010009", "title": {"en": "Languages"}},
    {"id": "L-00010010", "title": {"en": "Education and career guidance"}},
    {"id": "L-00010011", "title": {"en": "Health"}},
]
INDEXABLE_SUBJECTS = {subject["id"]: subject["title"]["en"] for subject in SUBJECTS}

COURSES = [
    {
        "categories": [subject["id"] for subject in SUBJECTS],
        "categories_names": {"en": [subject["title"]["en"] for subject in SUBJECTS]},
        "description": {"en": "Lorem ipsum dolor sit amet, consectetur adipiscim."},
        "id": "101",
        "is_new": True,
        "organizations": [],
        "organizations_names": {"en": []},
        "persons": [],
        "persons_names": {"en": []},
        "title": {"en": "Lorem ipsum dolor sit amet, consectetur adipiscim."},
    },
    {
        "categories": [SUBJECTS[1]["id"], SUBJECTS[2]["id"]],
        "categories_names": {
            "en": [SUBJECTS[1]["title"]["en"], SUBJECTS[2]["title"]["en"]]
        },
        "description": {"en": "Artisanally-sourced clicks neque. erat volutpat."},
        "id": "102",
        "is_new": True,
        "organizations": [],
        "organizations_names": {"en": []},
        "persons": [],
        "persons_names": {},
        "title": {"en": "Artisanally-sourced clicks neque. erat volutpat."},
    },
    {
        "categories": [SUBJECTS[3]["id"], SUBJECTS[4]["id"]],
        "categories_names": {
            "en": [SUBJECTS[3]["title"]["en"], SUBJECTS[3]["title"]["en"]]
        },
        "description": {"en": "Cursus honorum finite que non luctus ante."},
        "id": "103",
        "is_new": False,
        "organizations": [],
        "organizations_names": {"en": []},
        "persons": [],
        "persons_names": {},
        "title": {"en": "Cursus honorum finite que non luctus ante."},
    },
    {
        "categories": [SUBJECTS[0]["id"]],
        "categories_names": {"en": [SUBJECTS[0]["title"]["en"]]},
        "description": {"en": "Nullam ornare finibus sollicitudin."},
        "id": "104",
        "is_new": False,
        "organizations": [],
        "organizations_names": {"en": []},
        "persons": [],
        "persons_names": {"en": []},
        "title": {"en": "Nullam ornare finibus sollicitudin."},
    },
]


@mock.patch.dict(  # Reduce the number of languages
    ALL_LANGUAGES_DICT, {"en": "#en", "fr": "#fr"}, clear=True
)
@mock.patch.object(  # Avoid having to build the categories and organizations indices
    IndexableFilterDefinition, "get_i18n_names", return_value=INDEXABLE_SUBJECTS
)
@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    CoursesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_courses",
)
class FacetLimitsCoursesQueryTestCase(TestCase):
    """
    Test search queries on courses to make sure they respect our default and maximum limits
    for displayed facet counts in filters.
    """

    def setUp(self):
        """Reset indexable filters cache before each test so the context is as expected."""
        super().setUp()
        self.reset_filter_definitions_cache()

    def tearDown(self):
        """Reset indexable filters cache after each test to avoid impacting subsequent tests."""
        super().tearDown()
        self.reset_filter_definitions_cache()

    @staticmethod
    def reset_filter_definitions_cache():
        """Reset indexable filters cache on the `base_page` field."""
        for filter_name in ["levels", "subjects", "organizations"]:
            # pylint: disable=protected-access
            FILTERS[filter_name]._base_page = None

    def execute_query(self, querystring=""):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class: create and fill the
        index with our courses so we can run our queries and check our facet counts.
        It also executes the query and returns the result from the API.
        """
        # Create the subject category page. This is necessary to link the subjects we
        # defined above with the "subjects" filter
        # As it is the only page we create, we expect it to have the path "0001"
        CategoryFactory(page_reverse_id="subjects", should_publish=True)

        # Index these 4 courses in Elasticsearch
        indices_client = IndicesClient(client=ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_courses")
        indices_client.close(index="test_courses")
        indices_client.put_settings(body=ANALYSIS_SETTINGS, index="test_courses")
        indices_client.open(index="test_courses")

        # Use the default courses mapping from the Indexer
        indices_client.put_mapping(
            body=CoursesIndexer.mapping, doc_type="course", index="test_courses"
        )
        # Add the sorting script
        ES_CLIENT.put_script(id="state", body=CoursesIndexer.scripts["state"])
        # Actually insert our courses in the index
        actions = [
            {
                "_id": course["id"],
                "_index": "test_courses",
                "_op_type": "create",
                "_type": "course",
                "absolute_url": {"en": "url"},
                "cover_image": {"en": "image"},
                "title": {"en": "title"},
                **course,
                "course_runs": [],
            }
            for course in COURSES
        ]
        bulk(actions=actions, chunk_size=500, client=ES_CLIENT)
        indices_client.refresh()

        response = self.client.get(f"/api/v1.0/courses/?{querystring:s}")
        self.assertEqual(response.status_code, 200)

        return json.loads(response.content)

    @mock.patch(
        "richie.apps.search.filter_definitions.mixins.FACET_COUNTS_DEFAULT_LIMIT", new=5
    )
    def test_query_courses_uses_default_facet_limit(self, *_):
        """
        Ensure the query returns up to the top N facet values as defined by the
        `FACET_COUNTS_DEFAULT_LIMIT` for any given filter, no matter the number of
        available facet values.
        """
        content = self.execute_query(querystring="scope=filters")
        self.assertEqual(
            content,
            {
                "meta": {"count": 4, "offset": 0, "total_count": 4},
                "filters": {
                    "new": {
                        "human_name": "New courses",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "name": "new",
                        "position": 0,
                        "values": [
                            {"count": 2, "human_name": "First session", "key": "new"}
                        ],
                    },
                    "availability": {
                        "human_name": "Availability",
                        "is_autocompletable": False,
                        "is_drilldown": True,
                        "name": "availability",
                        "position": 1,
                        "values": [
                            {
                                "count": 0,
                                "human_name": "Open for enrollment",
                                "key": "open",
                            },
                            {
                                "count": 0,
                                "human_name": "Coming soon",
                                "key": "coming_soon",
                            },
                            {"count": 0, "human_name": "On-going", "key": "ongoing"},
                            {"count": 0, "human_name": "Archived", "key": "archived"},
                        ],
                    },
                    "subjects": {
                        "base_path": "0001",
                        "human_name": "Subjects",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "subjects",
                        "position": 2,
                        "values": [
                            {
                                "count": 2,
                                "human_name": SUBJECTS[i]["title"]["en"],
                                "key": SUBJECTS[i]["id"],
                            }
                            for i in range(0, 5)
                        ],
                    },
                    "levels": {
                        "base_path": None,
                        "human_name": "Levels",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "levels",
                        "position": 3,
                        "values": [],
                    },
                    "organizations": {
                        "base_path": None,
                        "human_name": "Organizations",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "organizations",
                        "position": 4,
                        "values": [],
                    },
                    "languages": {
                        "human_name": "Languages",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "name": "languages",
                        "position": 5,
                        "values": [],
                    },
                    "persons": {
                        "base_path": None,
                        "human_name": "Persons",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "persons",
                        "position": 5,
                        "values": [],
                    },
                },
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.mixins.FACET_COUNTS_DEFAULT_LIMIT", new=5
    )
    @mock.patch(
        "richie.apps.search.filter_definitions.mixins.FACET_COUNTS_MAX_LIMIT", new=10
    )
    def test_query_courses_returns_all_requested_facets_from_include(self, *_):
        """
        When the `foo_include` parameter is present in the query, more values are included
        in the facet counts for the `foo` filter, up to `FACET_COUNTS_MAX_LIMIT`.
        """
        content = self.execute_query(
            querystring="scope=filters&subjects_include=.*-0001.{4}"
        )
        self.assertEqual(
            content,
            {
                "meta": {"count": 4, "offset": 0, "total_count": 4},
                "filters": {
                    "new": {
                        "human_name": "New courses",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "name": "new",
                        "position": 0,
                        "values": [
                            {"count": 2, "human_name": "First session", "key": "new"}
                        ],
                    },
                    "availability": {
                        "human_name": "Availability",
                        "is_autocompletable": False,
                        "is_drilldown": True,
                        "name": "availability",
                        "position": 1,
                        "values": [
                            {
                                "count": 0,
                                "human_name": "Open for enrollment",
                                "key": "open",
                            },
                            {
                                "count": 0,
                                "human_name": "Coming soon",
                                "key": "coming_soon",
                            },
                            {"count": 0, "human_name": "On-going", "key": "ongoing"},
                            {"count": 0, "human_name": "Archived", "key": "archived"},
                        ],
                    },
                    "subjects": {
                        "base_path": "0001",
                        "human_name": "Subjects",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "subjects",
                        "position": 2,
                        "values": [
                            *[
                                {
                                    "count": 2,
                                    "human_name": SUBJECTS[i]["title"]["en"],
                                    "key": SUBJECTS[i]["id"],
                                }
                                for i in range(0, 5)
                            ],
                            *[
                                {
                                    "count": 1,
                                    "human_name": SUBJECTS[i]["title"]["en"],
                                    "key": SUBJECTS[i]["id"],
                                }
                                for i in range(5, 10)
                            ],
                        ],
                    },
                    "levels": {
                        "base_path": None,
                        "human_name": "Levels",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "levels",
                        "position": 3,
                        "values": [],
                    },
                    "organizations": {
                        "base_path": None,
                        "human_name": "Organizations",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "organizations",
                        "position": 4,
                        "values": [],
                    },
                    "languages": {
                        "human_name": "Languages",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "name": "languages",
                        "position": 5,
                        "values": [],
                    },
                    "persons": {
                        "base_path": None,
                        "human_name": "Persons",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "name": "persons",
                        "position": 5,
                        "values": [],
                    },
                },
            },
        )
