"""
Tests for course autocomplete
"""
import json
from unittest import mock

from django.test import TestCase

from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.search import ES_CLIENT
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS
from richie.apps.search.utils.indexers import slice_string_for_completion

COURSES_INDEX = "test_courses"


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

    def execute_query(self, querystring="", **extra):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        courses = [
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
                "path": "001001",
                "title": {
                    "en": "Kung-fu moves for cloud infrastructure security",
                    "fr": "Prôtéger ses serveurs par la pratique des arts martiaux",
                },
            },
            {
                "complete": {
                    "en": slice_string_for_completion(
                        "Securing funding through token sales"
                    ),
                    "fr": slice_string_for_completion("Lever des fonds par des ICO"),
                },
                "course_runs": [],
                "id": "51",
                "path": "001002",
                "title": {
                    "en": "Securing funding through token sales",
                    "fr": "Lever des fonds par des ICO",
                },
            },
        ]

        indices_client = IndicesClient(client=ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index=COURSES_INDEX)

        # The index needs to be closed before we set an analyzer
        indices_client.close(index=COURSES_INDEX)
        indices_client.put_settings(body=ANALYSIS_SETTINGS, index=COURSES_INDEX)
        indices_client.open(index=COURSES_INDEX)

        # Use the default courses mapping from the Indexer
        indices_client.put_mapping(
            body=CoursesIndexer.mapping, doc_type="course", index=COURSES_INDEX
        )
        # Add the sorting script
        ES_CLIENT.put_script(id="state", body=CoursesIndexer.scripts["state"])
        # Actually insert our courses in the index
        actions = [
            {
                "_id": course["id"],
                "_index": COURSES_INDEX,
                "_op_type": "create",
                "_type": "course",
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
        bulk(actions=actions, chunk_size=500, client=ES_CLIENT)
        indices_client.refresh()

        response = self.client.get(
            f"/api/v1.0/courses/autocomplete/?{querystring:s}", **extra
        )
        self.assertEqual(response.status_code, 200)

        return courses, json.loads(response.content)

    def test_autocomplete_text(self, *_):
        """
        Make sure autocomplete is operational and returns the expected courses.
        """
        all_courses, response = self.execute_query(querystring="query=sec")
        self.assertEqual(
            [all_courses[i]["id"] for i in [2, 1]],
            [course["id"] for course in response],
        )
        all_courses, response = self.execute_query(querystring="query=kung-fu")
        self.assertEqual([all_courses[1]["id"]], [course["id"] for course in response])

    def test_autocomplete_diacritics_insensitive_query(self, *_):
        """
        Queries are diacritics insensitive.
        """
        all_courses, response = self.execute_query(querystring="query=sécür")
        self.assertEqual(
            [all_courses[i]["id"] for i in [2, 1]],
            [course["id"] for course in response],
        )

    def test_autocomplete_diacritics_insensitive_index(self, *_):
        """
        Index is diacritics insensitive.
        """
        all_courses, response = self.execute_query(
            querystring="query=champinon", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual([all_courses[0]["id"]], [course["id"] for course in response])

        # Sanity check for original, accented version
        all_courses, response = self.execute_query(
            querystring="query=prôtéger", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual([all_courses[1]["id"]], [course["id"] for course in response])
