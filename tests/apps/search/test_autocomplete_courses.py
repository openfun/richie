"""
Tests for course autocomplete
"""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS
from richie.apps.search.utils.indexers import slice_string_for_completion

COURSES_INDEX = "test_courses"

TEST_COURSES = [
    {
        "complete": {
            "en": slice_string_for_completion(
                "Artificial intelligence for mushroom picking"
            ),
            "fr": slice_string_for_completion(
                "Intelligence artificielle pour la cueillette de chàmpiñons"
            ),
        },
        "course_runs": [],
        "id": "24",
        "is_listed": True,
        "path": "001000",
        "title": {
            "en": "Artificial intelligence for mushroom picking",
            "fr": "Intelligence artificielle pour la cueillette de chàmpiñons",
        },
    },
    {
        "complete": {
            "en": slice_string_for_completion(
                "Kung-fu moves for cloud infrastructure security"
            ),
            "fr": slice_string_for_completion(
                "Protéger ses serveurs par la pratique des arts martiaux"
            ),
        },
        "course_runs": [],
        "id": "33",
        "is_listed": True,
        "path": "001001",
        "title": {
            "en": "Kung-fu moves for cloud infrastructure security",
            "fr": "Prôtéger ses serveurs par la pratique des arts martiaux",
        },
    },
    {
        "complete": {
            "en": slice_string_for_completion("Securing funding through token sales"),
            "fr": slice_string_for_completion("Lever des fonds par des ICO"),
        },
        "course_runs": [],
        "id": "51",
        "is_listed": True,
        "path": "001002",
        "title": {
            "en": "Securing funding through token sales",
            "fr": "Lever des fonds par des ICO",
        },
    },
]


@mock.patch.object(  # Plug the test index we're filling on the indexer itself
    CoursesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value=COURSES_INDEX,
)
class AutocompleteCoursesTestCase(TestCase):
    """
    Test course autocomplete queries in a real-world situation with ElasticSearch.
    """

    def execute_query(self, courses, querystring="", **extra):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index=COURSES_INDEX)

        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=COURSES_INDEX)
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=COURSES_INDEX)
        ES_INDICES_CLIENT.open(index=COURSES_INDEX)

        # Use the default courses mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(body=CoursesIndexer.mapping, index=COURSES_INDEX)
        # Add the sorting script
        ES_CLIENT.put_script(id="score", body=CoursesIndexer.scripts["score"])
        ES_CLIENT.put_script(
            id="state_field", body=CoursesIndexer.scripts["state_field"]
        )

        # Actually insert our courses in the index
        actions = [
            {
                "_id": course["id"],
                "_index": COURSES_INDEX,
                "_op_type": "create",
                "absolute_url": {"en": "en/url", "fr": "fr/url"},
                "categories": ["1", "2", "3"],
                "cover_image": {"en": "en/image", "fr": "fr/image"},
                "is_meta": False,
                "logo": {"en": "/en/some/img.png", "fr": "/fr/some/img.png"},
                "nb_children": 0,
                "organizations": ["11", "12", "13"],
                **course,
            }
            for course in courses
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        results = self.client.get(
            f"/api/v1.0/courses/autocomplete/?{querystring:s}", **extra
        )
        self.assertEqual(results.status_code, 200)

        return json.loads(results.content)

    def test_autocomplete_missing_query(self, *_):
        """
        When the query is missing, the API returns a 400 error with an appropriate error.
        """
        response = self.client.get("/api/v1.0/courses/autocomplete/?")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ['Missing autocomplete "query" for request to test_courses.']},
        )

    def test_autocomplete_text(self, *_):
        """
        Make sure autocomplete is operational and returns the expected courses.
        """
        results = self.execute_query(TEST_COURSES, querystring="query=sec")
        self.assertEqual(
            [TEST_COURSES[i]["id"] for i in [2, 1]],
            [course["id"] for course in results],
        )
        results = self.execute_query(TEST_COURSES, querystring="query=kung-fu")
        self.assertEqual([TEST_COURSES[1]["id"]], [course["id"] for course in results])

    def test_autocomplete_diacritics_insensitive_query(self, *_):
        """
        Queries are diacritics insensitive.
        """
        results = self.execute_query(TEST_COURSES, querystring="query=sécür")
        self.assertEqual(
            [TEST_COURSES[i]["id"] for i in [2, 1]],
            [course["id"] for course in results],
        )

    def test_autocomplete_diacritics_insensitive_index(self, *_):
        """
        Index is diacritics insensitive.
        """
        results = self.execute_query(
            TEST_COURSES, querystring="query=champinon", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual([TEST_COURSES[0]["id"]], [course["id"] for course in results])

        # Sanity check for original, accented version
        results = self.execute_query(
            TEST_COURSES, querystring="query=prôtéger", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual([TEST_COURSES[1]["id"]], [course["id"] for course in results])

    def test_autocomplete_is_listed(self, *_):
        """
        Courses that are not flagged for listing should not appear in results.
        """
        all_courses = [
            {
                "complete": {
                    "en": slice_string_for_completion(
                        "Artificial intelligence for mushroom picking"
                    )
                },
                "course_runs": [],
                "id": "24",
                "path": "001000",
                "title": {"en": "Artificial intelligence for mushroom picking"},
            },
            {
                "complete": None,
                "course_runs": [],
                "id": "25",
                "path": "001001",
                "title": {"en": "Artificial intelligence for mushroom picking"},
            },
        ]
        results = self.execute_query(all_courses, querystring="query=intelligence")
        self.assertEqual([all_courses[0]["id"]], [course["id"] for course in results])
