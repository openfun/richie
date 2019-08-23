"""Integration tests for actual search results and their ordering."""
# pylint: disable=too-many-lines
import json
import random
from unittest import mock

from django.test import TestCase

import arrow
from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.courses.factories import CategoryFactory, OrganizationFactory
from richie.apps.search import ES_CLIENT
from richie.apps.search.filter_definitions import FILTERS, IndexableFilterDefinition
from richie.apps.search.filter_definitions.courses import ALL_LANGUAGES_DICT
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

COURSES = [
    {
        "categories": ["P-00010001", "P-00010002", "L-000100010001", "L-00020001"],
        "categories_names": {"en": ["Artificial intelligence", "Autumn", "Wilderness"]},
        "description": {
            "en": (
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec egestas "
                "lectus. Cras eget lobortis eros. Suspendisse hendrerit dictum ex, eget pharetra. "
                "Pellentesque habitant morbi tristique senectus et netus et malesuada fames "
                "ac turpis egestas. Integer ut eleifend massa."
            )
        },
        "is_new": True,
        "organizations": ["P-00030001", "P-00030004", "L-000300010001"],
        "organizations_names": {"en": ["Org 31", "Org 34", "Org 311"]},
        "persons": ["2"],
        "persons_names": {"en": ["Mikhaïl Boulgakov"]},
        "title": {"en": "Artificial intelligence for mushroom picking"},
    },
    {
        "categories": ["P-00010001", "P-00010003", "L-000100010002", "L-00020003"],
        "categories_names": {"en": ["Martial arts?", "Autumn"]},
        "description": {
            "en": (
                "Artisanally-sourced clicks neque. erat volutpat. Nulla at laoreet. "
                "Finibus viverra tortor et pulvinar. In placerat interdum arcu, ac ullamcorper "
                "augue. Nam sed semper velit. Praesent orci nulla, malesuada nec commodo at, "
                "lobortis eget justo."
            )
        },
        "is_new": True,
        "organizations": ["P-00030001", "P-00030003", "L-000300010002"],
        "organizations_names": {"en": ["Org 31", "Org 33", "Org 312"]},
        "persons": [],
        "persons_names": {},
        "title": {"en": "Click-farms: managing the autumn harvest"},
    },
    {
        "categories": ["P-00010002", "P-00010003", "L-000100020001", "L-00020001"],
        "categories_names": {"en": ["Artificial intelligence", "Water", "Wilderness"]},
        "description": {
            "en": (
                "Cursus honorum finite que non luctus ante. Etiam accumsan vulputate magna non "
                "sollicitudin. Aliquam molestie est finibus elit scelerisque laoreet. Maecenas "
                "porttitor cursus cursus. Nam pellentesque eget neque quis tincidunt. Fusce sem "
                "ipsum, dignissim at augue."
            )
        },
        "is_new": False,
        "organizations": ["P-00030002", "P-00030003", "L-000300020001"],
        "organizations_names": {"en": ["Org 32", "Org 33", "Org 321"]},
        "persons": [],
        "persons_names": {},
        "title": {"en": "Building a data lake out of mountain springs"},
    },
    {
        "categories": ["P-00010002", "P-00010004", "L-000100020002", "L-00020002"],
        "categories_names": {"en": ["Martial arts?", "Water"]},
        "description": {
            "en": (
                "Nullam ornare finibus sollicitudin. Aliquam nisl leo, vestibulum a turpis quis, "
                "convallis tincidunt sem. Aliquam eleifend tellus vitae neque sagittis rutrum. "
                "Artificial vulputate neque placerat, commodo quam gravida, maximus lectus."
            )
        },
        "is_new": False,
        "organizations": ["P-00030002", "P-00030004", "L-000300020002"],
        "organizations_names": {"en": ["Org 32", "Org 34", "Org 322"]},
        "persons": ["2"],
        "persons_names": {"en": ["Mikhaïl Boulgakov"]},
        "title": {"en": "Kung-fu moves for cloud infrastructure security"},
    },
]
INDEXABLE_IDS = {
    id: f"#{id:s}"
    for course in COURSES
    for id in course["categories"] + course["organizations"] + course["persons"]
}
COURSE_RUNS = {
    "A": {
        # A) ongoing course, next open course to end enrollment
        "start": arrow.utcnow().shift(days=-5).datetime,
        "end": arrow.utcnow().shift(days=+120).datetime,
        "enrollment_start": arrow.utcnow().shift(days=-15).datetime,
        "enrollment_end": arrow.utcnow().shift(days=+5).datetime,
        "languages": ["fr"],
    },
    "B": {
        # B) ongoing course, can still be enrolled in for longer than A)
        "start": arrow.utcnow().shift(days=-15).datetime,
        "end": arrow.utcnow().shift(days=+105).datetime,
        "enrollment_start": arrow.utcnow().shift(days=-30).datetime,
        "enrollment_end": arrow.utcnow().shift(days=+15).datetime,
        "languages": ["en"],
    },
    "C": {
        # C) not started yet, first upcoming course to start
        "start": arrow.utcnow().shift(days=+15).datetime,
        "end": arrow.utcnow().shift(days=+150).datetime,
        "enrollment_start": arrow.utcnow().shift(days=-30).datetime,
        "enrollment_end": arrow.utcnow().shift(days=+30).datetime,
        "languages": ["en"],
    },
    "D": {
        # D) not started yet, will start after the other upcoming course
        "start": arrow.utcnow().shift(days=+45).datetime,
        "end": arrow.utcnow().shift(days=+120).datetime,
        "enrollment_start": arrow.utcnow().shift(days=+30).datetime,
        "enrollment_end": arrow.utcnow().shift(days=+60).datetime,
        "languages": ["fr", "de"],
    },
    "E": {
        # E) ongoing course, most recent to end enrollment
        "start": arrow.utcnow().shift(days=-90).datetime,
        "end": arrow.utcnow().shift(days=+15).datetime,
        "enrollment_start": arrow.utcnow().shift(days=-120).datetime,
        "enrollment_end": arrow.utcnow().shift(days=-30).datetime,
        "languages": ["en"],
    },
    "F": {
        # F) ongoing course, enrollment has been over for the longest
        "start": arrow.utcnow().shift(days=-75).datetime,
        "end": arrow.utcnow().shift(days=+30).datetime,
        "enrollment_start": arrow.utcnow().shift(days=-100).datetime,
        "enrollment_end": arrow.utcnow().shift(days=-45).datetime,
        "languages": ["fr"],
    },
    "G": {
        # G) the other already finished course; it finished more recently than H)
        "start": arrow.utcnow().shift(days=-80).datetime,
        "end": arrow.utcnow().shift(days=-15).datetime,
        "enrollment_start": arrow.utcnow().shift(days=-100).datetime,
        "enrollment_end": arrow.utcnow().shift(days=-60).datetime,
        "languages": ["en"],
    },
    "H": {
        # H) the course that has been over for the longest
        "start": arrow.utcnow().shift(days=-120).datetime,
        "end": arrow.utcnow().shift(days=-30).datetime,
        "enrollment_start": arrow.utcnow().shift(days=-150).datetime,
        "enrollment_end": arrow.utcnow().shift(days=-90).datetime,
        "languages": ["en", "de"],
    },
}


# pylint: disable=too-many-public-methods
@mock.patch.dict(  # Reduce the number of languages
    ALL_LANGUAGES_DICT,
    {l: "#{:s}".format(l) for cr in COURSE_RUNS.values() for l in cr["languages"]},
    clear=True,
)
@mock.patch.object(  # Avoid having to build the categories and organizations indices
    IndexableFilterDefinition, "get_i18n_names", return_value=INDEXABLE_IDS
)
@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    CoursesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_courses",
)
class CourseRunsCoursesQueryTestCase(TestCase):
    """
    Test search queries on courses and underlying course runs to make sure filtering and sorting
    works as expected.
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

    @staticmethod
    def create_filter_pages():
        """
        Create pages for each filter based on an indexable. We must create them in the same order
        as they are instantiated in order to match the node paths we expect:
            - subjects page path: 0001
            - levels page path: 0002
            - organizations page path: 0003
        """
        CategoryFactory(page_reverse_id="subjects", should_publish=True)
        CategoryFactory(page_reverse_id="levels", should_publish=True)
        OrganizationFactory(page_reverse_id="organizations", should_publish=True)

    @staticmethod
    def get_expected_courses(courses_definition, course_run_ids):
        """
        Compute the expected course ids from the course run ids.
        """
        # Remove courses that don't have archived course runs
        # > [[3, ["H", "D"]], [2, ["G", "E"]]]
        filtered_courses = list(
            filter(
                lambda o: any([id in course_run_ids for id in o[1]]), courses_definition
            )
        )

        # Sort our courses according to the ranking of their open course runs:
        # > [[2, ["G", "E"]], [3, ["H", "D"]]]
        # Note that we only consider open course runs to sort our courses otherwise
        # some better course runs could make it incoherent. In our example, the "C"
        # course run, if taken into account, would have lead to the following sequence
        # which is not what we expect:
        #   [[2, ["H", "D"]], [3, ["G", "E"]]]
        sorted_courses = sorted(
            filtered_courses,
            key=lambda o: min(
                [course_run_ids.index(id) for id in o[1] if id in course_run_ids]
            ),
        )

        # Extract the expected list of courses
        # > [1, 3, 0]
        return list(list(zip(*sorted_courses))[0])

    def execute_query(self, querystring="", suite=None):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class:
        - generate a set of courses randomly associated to our "interesting" course runs,
        - prepare the Elasticsearch index,
        - execute the query.
        """
        # Shuffle our course runs to assign them randomly to 4 courses
        # For example: ["H", "D", "C", "F", "B", "A", "G", "E"]
        suite = suite or random.sample(list(COURSE_RUNS), len(COURSE_RUNS))

        # Assume 4 courses and associate 2 course runs to each course
        # > [[3, ["H", "D"]], [0, ["C", "F"]], [1, ["B", "A"]], [2, ["G", "E"]]]
        courses_definition = [[i, suite[2 * i : 2 * i + 2]] for i in range(4)]  # noqa

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
        now = arrow.utcnow()
        actions = [
            {
                "_id": course_id,
                "_index": "test_courses",
                "_op_type": "create",
                "_type": "course",
                # The sorting algorithm assumes that course runs are sorted by decreasing
                # end date in order to limit the number of iterations and courses with a
                # lot of archived courses.
                "absolute_url": {"en": "url"},
                "cover_image": {"en": "cover_image.jpg"},
                "icon": {"en": "icon.jpg"},
                "title": {"en": "title"},
                **COURSES[course_id],
                "course_runs": sorted(
                    [
                        # Each course randomly gets 2 course runs (thanks to above shuffle)
                        COURSE_RUNS[course_run_id]
                        for course_run_id in course_run_ids
                    ],
                    key=lambda o: now - o["end"],
                ),
            }
            for course_id, course_run_ids in courses_definition
        ]
        bulk(actions=actions, chunk_size=500, client=ES_CLIENT)
        indices_client.refresh()

        response = self.client.get(f"/api/v1.0/courses/?{querystring:s}")
        self.assertEqual(response.status_code, 200)

        return courses_definition, json.loads(response.content)

    def test_query_courses_match_all(self, *_):
        """
        Validate the detailed format of the response to a match all query.
        We force the suite to a precise example because the facet count may vary if for example
        the two course runs in german end-up on the same course (in this case the facet count
        should be 1. See next test).
        """
        self.create_filter_pages()
        _, content = self.execute_query(suite=["A", "D", "G", "F", "B", "H", "C", "E"])
        self.assertEqual(
            content,
            {
                "meta": {"count": 4, "offset": 0, "total_count": 4},
                "objects": [
                    {
                        "id": "0",
                        "absolute_url": "url",
                        "categories": [
                            "P-00010001",
                            "P-00010002",
                            "L-000100010001",
                            "L-00020001",
                        ],
                        "cover_image": "cover_image.jpg",
                        "icon": "icon.jpg",
                        "organization_highlighted": "Org 31",
                        "organizations": ["P-00030001", "P-00030004", "L-000300010001"],
                        "state": {
                            "priority": 0,
                            "call_to_action": "enroll now",
                            "datetime": COURSE_RUNS["A"]["enrollment_end"]
                            .isoformat()
                            .replace("+00:00", "Z"),
                            "text": "closing on",
                        },
                        "title": "Artificial intelligence for mushroom picking",
                    },
                    {
                        "id": "2",
                        "absolute_url": "url",
                        "categories": [
                            "P-00010002",
                            "P-00010003",
                            "L-000100020001",
                            "L-00020001",
                        ],
                        "cover_image": "cover_image.jpg",
                        "icon": "icon.jpg",
                        "organization_highlighted": "Org 32",
                        "organizations": ["P-00030002", "P-00030003", "L-000300020001"],
                        "state": {
                            "priority": 0,
                            "datetime": COURSE_RUNS["B"]["enrollment_end"]
                            .isoformat()
                            .replace("+00:00", "Z"),
                            "call_to_action": "enroll now",
                            "text": "closing on",
                        },
                        "title": "Building a data lake out of mountain springs",
                    },
                    {
                        "id": "3",
                        "absolute_url": "url",
                        "categories": [
                            "P-00010002",
                            "P-00010004",
                            "L-000100020002",
                            "L-00020002",
                        ],
                        "cover_image": "cover_image.jpg",
                        "icon": "icon.jpg",
                        "organization_highlighted": "Org 32",
                        "organizations": ["P-00030002", "P-00030004", "L-000300020002"],
                        "state": {
                            "priority": 1,
                            "datetime": COURSE_RUNS["C"]["start"]
                            .isoformat()
                            .replace("+00:00", "Z"),
                            "call_to_action": "enroll now",
                            "text": "starting on",
                        },
                        "title": "Kung-fu moves for cloud infrastructure security",
                    },
                    {
                        "id": "1",
                        "absolute_url": "url",
                        "categories": [
                            "P-00010001",
                            "P-00010003",
                            "L-000100010002",
                            "L-00020003",
                        ],
                        "cover_image": "cover_image.jpg",
                        "icon": "icon.jpg",
                        "organization_highlighted": "Org 31",
                        "organizations": ["P-00030001", "P-00030003", "L-000300010002"],
                        "state": {
                            "priority": 4,
                            "datetime": None,
                            "call_to_action": None,
                            "text": "on-going",
                        },
                        "title": "Click-farms: managing the autumn harvest",
                    },
                ],
                "filters": {
                    "availability": {
                        "has_more_values": False,
                        "human_name": "Availability",
                        "is_autocompletable": False,
                        "is_drilldown": True,
                        "is_searchable": False,
                        "name": "availability",
                        "position": 1,
                        "values": [
                            {
                                "count": 3,
                                "human_name": "Open for enrollment",
                                "key": "open",
                            },
                            {
                                "count": 2,
                                "human_name": "Coming soon",
                                "key": "coming_soon",
                            },
                            {"count": 4, "human_name": "On-going", "key": "ongoing"},
                            {"count": 2, "human_name": "Archived", "key": "archived"},
                        ],
                    },
                    "languages": {
                        "has_more_values": False,
                        "human_name": "Languages",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "languages",
                        "position": 5,
                        "values": [
                            {"count": 3, "human_name": "#en", "key": "en"},
                            {"count": 2, "human_name": "#de", "key": "de"},
                            {"count": 2, "human_name": "#fr", "key": "fr"},
                        ],
                    },
                    "levels": {
                        "base_path": "0002",
                        "has_more_values": False,
                        "human_name": "Levels",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "levels",
                        "position": 3,
                        "values": [
                            {
                                "count": 2,
                                "human_name": "#L-00020001",
                                "key": "L-00020001",
                            },
                            {
                                "count": 1,
                                "human_name": "#L-00020002",
                                "key": "L-00020002",
                            },
                            {
                                "count": 1,
                                "human_name": "#L-00020003",
                                "key": "L-00020003",
                            },
                        ],
                    },
                    "new": {
                        "has_more_values": False,
                        "human_name": "New courses",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "new",
                        "position": 0,
                        "values": [
                            {"count": 2, "human_name": "First session", "key": "new"}
                        ],
                    },
                    "organizations": {
                        "base_path": "0003",
                        "has_more_values": False,
                        "human_name": "Organizations",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "organizations",
                        "position": 4,
                        "values": [
                            {
                                "count": 2,
                                "human_name": "#P-00030001",
                                "key": "P-00030001",
                            },
                            {
                                "count": 2,
                                "human_name": "#P-00030002",
                                "key": "P-00030002",
                            },
                            {
                                "count": 2,
                                "human_name": "#P-00030003",
                                "key": "P-00030003",
                            },
                            {
                                "count": 2,
                                "human_name": "#P-00030004",
                                "key": "P-00030004",
                            },
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
                        "position": 5,
                        "values": [{"count": 2, "human_name": "#2", "key": "2"}],
                    },
                    "subjects": {
                        "base_path": "0001",
                        "has_more_values": False,
                        "human_name": "Subjects",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "subjects",
                        "position": 2,
                        "values": [
                            {
                                "count": 3,
                                "human_name": "#P-00010002",
                                "key": "P-00010002",
                            },
                            {
                                "count": 2,
                                "human_name": "#P-00010001",
                                "key": "P-00010001",
                            },
                            {
                                "count": 2,
                                "human_name": "#P-00010003",
                                "key": "P-00010003",
                            },
                            {
                                "count": 1,
                                "human_name": "#P-00010004",
                                "key": "P-00010004",
                            },
                        ],
                    },
                },
            },
        )

    def test_query_courses_match_all_grouped_course_runs(self, *_):
        """
        This test examines edge cases of the previous test which lead to different facet counts:
        - A/B and E/F course runs grouped under the same course:
          => 2 ongoing courses instead of 4
        - D/H course runs grouped under the same course:
          => 1 german course instead of 2
        """
        _, content = self.execute_query(suite=["A", "B", "G", "C", "D", "H", "F", "E"])
        self.assertEqual(
            list([o["state"] for o in content["objects"]]),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": COURSE_RUNS["A"]["enrollment_end"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 0,
                    "text": "closing on",
                },
                {
                    "call_to_action": "enroll now",
                    "datetime": COURSE_RUNS["C"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 1,
                    "text": "starting on",
                },
                {
                    "call_to_action": "see details",
                    "datetime": COURSE_RUNS["D"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 2,
                    "text": "starting on",
                },
                {
                    "call_to_action": None,
                    "datetime": None,
                    "priority": 4,
                    "text": "on-going",
                },
            ],
        )
        self.assertEqual(
            content["filters"]["languages"]["values"],
            [
                {"count": 4, "human_name": "#en", "key": "en"},
                {"count": 3, "human_name": "#fr", "key": "fr"},
                {"count": 1, "human_name": "#de", "key": "de"},
            ],
        )
        self.assertEqual(
            content["filters"]["availability"]["values"],
            [
                {"count": 2, "human_name": "Open for enrollment", "key": "open"},
                {"count": 2, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 2, "human_name": "Archived", "key": "archived"},
            ],
        )

    def test_query_courses_course_runs_filter_open_courses(self, *_):
        """
        Battle test filtering and sorting open courses.
        """
        courses_definition, content = self.execute_query("availability=open")
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, ["A", "B", "C"]),
        )

    def test_query_courses_match_all_scope_objects(self, *_):
        """
        The scope can be limited to objects via the querystring.
        """
        _courses_definition, content = self.execute_query("scope=objects")
        self.assertEqual(len(content["objects"]), 4)
        self.assertFalse("filters" in content)

    def test_query_courses_match_all_scope_filters(self, *_):
        """
        The scope can be limited to filters via the querystring.
        """
        _courses_definition, content = self.execute_query("scope=filters")
        self.assertEqual(len(content["filters"]), 7)
        self.assertFalse("objects" in content)

    def test_query_courses_course_runs_filter_availability_facets(self, *_):
        """
        Check that facet counts are affected on languages but not on availability
        when we filter on availability.
        We must fix the course runs suite because facet counts may vary if course
        runs with the same language (resp. availability) get grouped under the same
        course.
        """
        self.create_filter_pages()
        _, content = self.execute_query(
            "availability=open", suite=["A", "B", "G", "C", "D", "H", "F", "E"]
        )
        self.assertEqual(
            list([o["state"] for o in content["objects"]]),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": COURSE_RUNS["A"]["enrollment_end"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 0,
                    "text": "closing on",
                },
                {
                    "call_to_action": "enroll now",
                    "datetime": COURSE_RUNS["C"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 1,
                    "text": "starting on",
                },
            ],
        )
        self.assertEqual(
            content["filters"]["languages"]["values"],
            [
                {"count": 2, "human_name": "#en", "key": "en"},
                {"count": 1, "human_name": "#fr", "key": "fr"},
            ],
        )
        self.assertEqual(
            content["filters"]["availability"]["values"],
            [
                {"count": 2, "human_name": "Open for enrollment", "key": "open"},
                {"count": 2, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 2, "human_name": "Archived", "key": "archived"},
            ],
        )
        self.assertEqual(
            content["filters"]["subjects"]["values"],
            [
                {"count": 2, "human_name": "#P-00010001", "key": "P-00010001"},
                {"count": 1, "human_name": "#P-00010002", "key": "P-00010002"},
                {"count": 1, "human_name": "#P-00010003", "key": "P-00010003"},
                {"count": 0, "human_name": "#P-00010004", "key": "P-00010004"},
            ],
        )
        self.assertEqual(
            content["filters"]["levels"]["values"],
            [
                {"count": 1, "human_name": "#L-00020001", "key": "L-00020001"},
                {"count": 1, "human_name": "#L-00020003", "key": "L-00020003"},
                {"count": 0, "human_name": "#L-00020002", "key": "L-00020002"},
            ],
        )
        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {"count": 2, "human_name": "#P-00030001", "key": "P-00030001"},
                {"count": 1, "human_name": "#P-00030003", "key": "P-00030003"},
                {"count": 1, "human_name": "#P-00030004", "key": "P-00030004"},
                {"count": 0, "human_name": "#P-00030002", "key": "P-00030002"},
            ],
        )

    def test_query_courses_course_runs_filter_ongoing_courses(self, *_):
        """
        Battle test filtering and sorting ongoing courses.
        """
        courses_definition, content = self.execute_query("availability=ongoing")
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, ["A", "B", "E", "F"]),
        )

    def test_query_courses_course_runs_filter_coming_soon_courses(self, *_):
        """
        Battle test filtering and sorting coming soon courses.
        """
        courses_definition, content = self.execute_query("availability=coming_soon")
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, ["C", "D"]),
        )

    def test_query_courses_course_runs_filter_archived_courses(self, *_):
        """
        Battle test filtering and sorting archived courses.
        """
        courses_definition, content = self.execute_query("availability=archived")
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, ["G", "H"]),
        )

    def test_query_courses_course_runs_filter_language(self, *_):
        """
        Battle test filtering and sorting courses in one language.
        """
        courses_definition, content = self.execute_query("languages=fr")
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, ["A", "D", "F"]),
        )

    def test_query_courses_course_runs_filter_language_facets(self, *_):
        """
        Check that facet counts are affected on availability but not on languages
        when we filter on languages.
        We must fix the course runs suite because facet counts may vary if course
        runs with the same language (resp. availability) get grouped under the same
        course.
        """
        self.create_filter_pages()
        _, content = self.execute_query(
            "languages=fr", suite=["A", "B", "G", "C", "D", "H", "F", "E"]
        )
        self.assertEqual(
            list([o["state"] for o in content["objects"]]),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": COURSE_RUNS["A"]["enrollment_end"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 0,
                    "text": "closing on",
                },
                {
                    "call_to_action": "see details",
                    "datetime": COURSE_RUNS["D"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 2,
                    "text": "starting on",
                },
                {
                    "call_to_action": None,
                    "datetime": None,
                    "priority": 4,
                    "text": "on-going",
                },
            ],
        )
        self.assertEqual(
            content["filters"]["languages"]["values"],
            [
                {"count": 4, "human_name": "#en", "key": "en"},
                {"count": 3, "human_name": "#fr", "key": "fr"},
                {"count": 1, "human_name": "#de", "key": "de"},
            ],
        )
        self.assertEqual(
            content["filters"]["availability"]["values"],
            [
                {"count": 1, "human_name": "Open for enrollment", "key": "open"},
                {"count": 1, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 0, "human_name": "Archived", "key": "archived"},
            ],
        )
        # A, D and F course runs are in French
        # So only courses 0, 2 and 3 are selected
        self.assertEqual(
            content["filters"]["subjects"]["values"],
            [
                {"count": 3, "human_name": "#P-00010002", "key": "P-00010002"},
                {"count": 1, "human_name": "#P-00010001", "key": "P-00010001"},
                {"count": 1, "human_name": "#P-00010003", "key": "P-00010003"},
                {"count": 1, "human_name": "#P-00010004", "key": "P-00010004"},
            ],
        )
        self.assertEqual(
            content["filters"]["levels"]["values"],
            [
                {"count": 2, "human_name": "#L-00020001", "key": "L-00020001"},
                {"count": 1, "human_name": "#L-00020002", "key": "L-00020002"},
                {"count": 0, "human_name": "#L-00020003", "key": "L-00020003"},
            ],
        )
        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {"count": 2, "human_name": "#P-00030002", "key": "P-00030002"},
                {"count": 2, "human_name": "#P-00030004", "key": "P-00030004"},
                {"count": 1, "human_name": "#P-00030001", "key": "P-00030001"},
                {"count": 1, "human_name": "#P-00030003", "key": "P-00030003"},
            ],
        )

    def test_query_courses_course_runs_filter_multiple_languages(self, *_):
        """
        Battle test filtering and sorting courses in several languages.
        """
        courses_definition, content = self.execute_query("languages=fr&languages=de")
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, ["A", "D", "F", "H"]),
        )

    def test_query_courses_course_runs_filter_composed(self, *_):
        """
        Battle test filtering and sorting courses on an availability AND a language.
        """
        courses_definition, content = self.execute_query(
            "availability=ongoing&languages=en"
        )
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, ["B", "E"]),
        )

    def test_query_courses_course_runs_filter_composed_facets(self, *_):
        """
        Check that facet counts are affected on availability and languages as expected
        when we filter on both languages and availability.
        We must fix the course runs suite because facet counts may vary if course
        runs with the same language (resp. availability) get grouped under the same
        course.
        """
        self.create_filter_pages()
        _, content = self.execute_query(
            "availability=ongoing&languages=en",
            suite=["A", "B", "G", "C", "D", "H", "F", "E"],
        )
        self.assertEqual(
            list([o["state"] for o in content["objects"]]),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": COURSE_RUNS["B"]["enrollment_end"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 0,
                    "text": "closing on",
                },
                {
                    "call_to_action": None,
                    "datetime": None,
                    "priority": 4,
                    "text": "on-going",
                },
            ],
        )
        self.assertEqual(
            content["filters"]["languages"]["values"],
            [
                {"count": 2, "human_name": "#en", "key": "en"},
                {"count": 2, "human_name": "#fr", "key": "fr"},
            ],
        )
        self.assertEqual(
            content["filters"]["availability"]["values"],
            [
                {"count": 2, "human_name": "Open for enrollment", "key": "open"},
                {"count": 1, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 2, "human_name": "Archived", "key": "archived"},
            ],
        )
        # Only the B and E course runs are on-going and in English
        # So only courses 0 and 3 are selected
        self.assertEqual(
            content["filters"]["subjects"]["values"],
            [
                {"count": 2, "human_name": "#P-00010002", "key": "P-00010002"},
                {"count": 1, "human_name": "#P-00010001", "key": "P-00010001"},
                {"count": 1, "human_name": "#P-00010004", "key": "P-00010004"},
                {"count": 0, "human_name": "#P-00010003", "key": "P-00010003"},
            ],
        )
        self.assertEqual(
            content["filters"]["levels"]["values"],
            [
                {"count": 1, "human_name": "#L-00020001", "key": "L-00020001"},
                {"count": 1, "human_name": "#L-00020002", "key": "L-00020002"},
                {"count": 0, "human_name": "#L-00020003", "key": "L-00020003"},
            ],
        )
        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {"count": 2, "human_name": "#P-00030004", "key": "P-00030004"},
                {"count": 1, "human_name": "#P-00030001", "key": "P-00030001"},
                {"count": 1, "human_name": "#P-00030002", "key": "P-00030002"},
                {"count": 0, "human_name": "#P-00030003", "key": "P-00030003"},
            ],
        )

    def test_query_courses_filter_new(self, *_):
        """
        Battle test filtering new courses.
        """
        courses_definition, content = self.execute_query("new=new")
        # Keep only the courses that are new:
        courses_definition = filter(lambda c: c[0] in [0, 1], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_filter_organization(self, *_):
        """
        Battle test filtering by an organization.
        """
        self.create_filter_pages()
        courses_definition, content = self.execute_query("organizations=P-00030002")
        # Keep only the courses that are linked to organization 00030002:
        courses_definition = filter(lambda c: c[0] in [2, 3], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )
        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {"count": 2, "human_name": "#P-00030001", "key": "P-00030001"},
                {"count": 2, "human_name": "#P-00030002", "key": "P-00030002"},
                {"count": 2, "human_name": "#P-00030003", "key": "P-00030003"},
                {"count": 2, "human_name": "#P-00030004", "key": "P-00030004"},
            ],
        )

    def test_query_courses_filter_multiple_organizations(self, *_):
        """
        Battle test filtering by multiple organizations.
        """
        courses_definition, content = self.execute_query(
            "organizations=P-00030002&organizations=L-000300010001"
        )
        # Keep only the courses that are linked to organizations 00030002 or 000300010001:
        courses_definition = filter(lambda c: c[0] in [0, 2, 3], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_filter_organization_include(self, *_):
        """
        It should be possible to limit faceting on an organization to specific values by
        passing a regex in the querystring.
        """
        self.create_filter_pages()
        _courses_definition, content = self.execute_query(
            "organizations_include=.*-00030001.{4}"
        )

        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {"count": 1, "human_name": "#L-000300010001", "key": "L-000300010001"},
                {"count": 1, "human_name": "#L-000300010002", "key": "L-000300010002"},
            ],
        )

    def test_query_courses_filter_subject(self, *_):
        """
        Battle test filtering by a subject.
        """
        courses_definition, content = self.execute_query("subjects=P-00010001")
        # Keep only the courses that are linked to subject 2:
        courses_definition = filter(lambda c: c[0] in [0, 1], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_filter_multiple_subjects(self, *_):
        """
        Battle test filtering by multiple subjects.
        """
        courses_definition, content = self.execute_query(
            "subjects=P-00010001&subjects=P-00010004"
        )
        # Keep only the courses that are linked to subjects 1 or 4:
        courses_definition = filter(lambda c: c[0] in [0, 1, 3], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_filter_subject_include(self, *_):
        """
        It should be possible to limit faceting on a subject to specific values by
        passing a regex in the querystring.
        """
        self.create_filter_pages()
        _courses_definition, content = self.execute_query(
            "subjects_include=.*-00010001.{4}"
        )

        self.assertEqual(
            content["filters"]["subjects"]["values"],
            [
                {"count": 1, "human_name": "#L-000100010001", "key": "L-000100010001"},
                {"count": 1, "human_name": "#L-000100010002", "key": "L-000100010002"},
            ],
        )

    def test_query_courses_filter_level(self, *_):
        """
        Battle test filtering by a level.
        """
        courses_definition, content = self.execute_query("levels=L-00020001")
        # Keep only the courses that are linked to level L-00020001:
        courses_definition = filter(lambda c: c[0] in [0, 2], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_filter_multiple_levels(self, *_):
        """
        Battle test filtering by multiple levels.
        """
        courses_definition, content = self.execute_query(
            "levels=L-00020001&levels=L-00020002"
        )
        # Keep only the courses that are linked to levels L-00020001 or L-00020002:
        courses_definition = filter(lambda c: c[0] in [0, 2, 3], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_match_all_no_filter_pages(self, *_):
        """
        Running a query when indexable filter pages are absent should result in empty facets.
        This behavior is because "include" defaults to the "^$" regex matching no values of the
        term when a `reverse_id` is set but no corresponding page is found.
        """
        _, content = self.execute_query()
        self.assertEqual(content["filters"]["subjects"]["values"], [])
        self.assertEqual(content["filters"]["levels"]["values"], [])
        self.assertEqual(content["filters"]["organizations"]["values"], [])

    def test_query_courses_by_related_person(self, *_):
        """
        Full-text search appropriately returns the list of courses that match a given
        related person name even through a text query.
        """
        courses_definition, content = self.execute_query("query=boulgakov")
        # Keep only the courses that are linked to persons whose name contains "boulgakov"
        courses_definition = filter(lambda c: c[0] in [0, 3], courses_definition)
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_text_language_analyzer(self, *_):
        """
        Full-text search appropriately returns the list of courses that match a given
        word through a language analyzer.
        """
        courses_definition, content = self.execute_query("query=artificial")
        # Keep only the courses that contain the word "artificial"
        courses_definition = filter(lambda c: c[0] in [2, 0, 3], courses_definition)
        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )

    def test_query_courses_text_language_analyzer_with_filter_category(self, *_):
        """
        Full-text search through the language analyzer combines with another filter.
        """
        courses_definition, content = self.execute_query(
            "query=artificial&subjects=P-00010001"
        )
        # Keep only the courses that are linked to category one and contain the word "artificial"
        courses_definition = filter(lambda c: c[0] in [0], courses_definition)

        self.assertEqual(
            list([int(c["id"]) for c in content["objects"]]),
            self.get_expected_courses(courses_definition, list(COURSE_RUNS)),
        )
