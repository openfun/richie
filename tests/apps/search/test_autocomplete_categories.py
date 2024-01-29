"""
Tests for category autocomplete
"""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS
from richie.apps.search.utils.indexers import slice_string_for_completion

CATEGORIES_INDEX = "test_categories"


@mock.patch.object(  # Plug the test index we're filling on the indexer itself
    CategoriesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value=CATEGORIES_INDEX,
)
class AutocompleteCategoriesTestCase(TestCase):
    """
    Test category autocomplete queries in a real-world situation with ElasticSearch.
    """

    def execute_query(self, querystring="", **extra):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        categories = [
            {
                "complete": {
                    "en": slice_string_for_completion("Electric Birdwatching"),
                    "fr": slice_string_for_completion(
                        "Observation des oiseaux électriques"
                    ),
                },
                "id": "24",
                "kind": "subjects",
                "path": "001000",
                "title": {
                    "en": "Electric Birdwatching",
                    "fr": "Observation des oiseaux électriques",
                },
            },
            {
                "complete": {
                    "en": slice_string_for_completion("Ocean biking"),
                    "fr": slice_string_for_completion("Cyclisme océanique"),
                },
                "id": "33",
                "kind": "subjects",
                "path": "001001",
                "title": {"en": "Ocean biking", "fr": "Cyclisme océanique"},
            },
            {
                "complete": {
                    "en": slice_string_for_completion("Elegiac bikeshedding"),
                    "fr": slice_string_for_completion("Élégie de l'abri à vélos"),
                },
                "id": "51",
                "kind": "subjects",
                "path": "001002",
                "title": {
                    "en": "Elegiac bikeshedding",
                    "fr": "Élégie de l'abri à vélos",
                },
            },
            {
                "complete": {
                    "en": slice_string_for_completion("Electric Decoys"),
                    "fr": slice_string_for_completion("Leurres électriques"),
                },
                "id": "44",
                "kind": "not_subjects",
                "path": "001003",
                "title": {"en": "Electric Decoys", "fr": "Leurres électriques"},
            },
        ]

        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index=CATEGORIES_INDEX)

        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=CATEGORIES_INDEX)
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=CATEGORIES_INDEX)
        ES_INDICES_CLIENT.open(index=CATEGORIES_INDEX)

        # Use the default categories mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=CategoriesIndexer.mapping, index=CATEGORIES_INDEX
        )

        # Actually insert our categories in the index
        actions = [
            {
                "_id": category["id"],
                "_index": CATEGORIES_INDEX,
                "_op_type": "create",
                "absolute_url": {"en": "en/url", "fr": "fr/url"},
                "cover_image": {"en": "en/image", "fr": "fr/image"},
                "is_meta": False,
                "logo": {"en": "en/some/img.png", "fr": "fr/some/img.png"},
                "nb_children": 0,
                **category,
            }
            for category in categories
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        response = self.client.get(
            f"/api/v1.0/subjects/autocomplete/?{querystring:s}", **extra
        )
        self.assertEqual(response.status_code, 200)

        return categories, json.loads(response.content)

    def test_autocomplete_missing_query(self, *_):
        """
        When the query is missing, the API returns a 400 error with an appropriate error.
        """
        response = self.client.get("/api/v1.0/subjects/autocomplete/?")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    'Missing autocomplete "query" for request to test_categories.'
                ]
            },
        )

    def test_autocomplete_text(self, *_):
        """
        Make sure autocomplete is operational and returns the expected categories.
        """
        all_categories, response = self.execute_query(querystring="query=Electric")
        # Does not include the 4th, "not_subjects" element
        self.assertEqual(
            response,
            [
                {
                    "id": all_categories[0]["id"],
                    "kind": "subjects",
                    "title": all_categories[0]["title"]["en"],
                }
            ],
        )

        all_categories, response = self.execute_query(querystring="query=bik")
        self.assertEqual(
            response,
            [
                {
                    "id": all_categories[2]["id"],
                    "kind": "subjects",
                    "title": all_categories[2]["title"]["en"],
                },
                {
                    "id": all_categories[1]["id"],
                    "kind": "subjects",
                    "title": all_categories[1]["title"]["en"],
                },
            ],
        )

    def test_autocomplete_diacritics_insensitive_query(self, *_):
        """
        Queries are diacritics insensitive.
        """
        all_categories, response = self.execute_query(querystring="query=élec")
        self.assertEqual(
            [all_categories[0]["id"]], [category["id"] for category in response]
        )

    def test_autocomplete_diacritics_insensitive_index(self, *_):
        """
        Index is diacritics insensitive.
        """
        all_categories, response = self.execute_query(
            querystring="query=elegie", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual(
            [all_categories[2]["id"]], [category["id"] for category in response]
        )

        # Sanity check for original, accented version
        all_categories, response = self.execute_query(
            querystring="query=Élégie", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual(
            [all_categories[2]["id"]], [category["id"] for category in response]
        )
