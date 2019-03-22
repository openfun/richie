"""
Tests for category autocomplete
"""
import json
from unittest import mock

from django.conf import settings
from django.test import TestCase

from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.utils.indexers import slice_string_for_completion


@mock.patch.object(  # Plug the test index we're filling on the indexer itself
    CategoriesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_categories",
)
class AutocompleteCategoriesTestCase(TestCase):
    """
    Test category autocomplete queries in a real-world situation with ElasticSearch.
    """

    def execute_query(self, querystring=""):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        categories = [
            {
                "complete": {
                    "en": slice_string_for_completion("Electric Birdwatching")
                },
                "id": "24",
                "path": "001000",
                "title": {"en": "Electric Birdwatching"},
            },
            {
                "complete": {"en": slice_string_for_completion("Ocean biking")},
                "id": "33",
                "path": "001001",
                "title": {"en": "Ocean biking"},
            },
            {
                "complete": {
                    "en": slice_string_for_completion("Eclectic bikeshedding")
                },
                "id": "51",
                "path": "001002",
                "title": {"en": "Eclectic bikeshedding"},
            },
        ]

        indices_client = IndicesClient(client=settings.ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_categories")
        # Use the default categories mapping from the Indexer
        indices_client.put_mapping(
            body=CategoriesIndexer.mapping, doc_type="category", index="test_categories"
        )
        # Actually insert our categories in the index
        actions = [
            {
                "_id": category["id"],
                "_index": "test_categories",
                "_op_type": "create",
                "_type": "category",
                "absolute_url": {"en": "url"},
                "cover_image": {"en": "image"},
                "is_meta": False,
                "logo": {"en": "/some/img.png"},
                "nb_children": 0,
                **category,
            }
            for category in categories
        ]
        bulk(
            actions=actions,
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
        )
        indices_client.refresh()

        response = self.client.get(
            f"/api/v1.0/categories/autocomplete/?{querystring:s}"
        )
        self.assertEqual(response.status_code, 200)

        return categories, json.loads(response.content)

    def test_autocomplete_text(self, *_):
        """
        Make sure autocomplete is operational and returns the expected categories.
        """
        all_categories, response = self.execute_query(querystring="query=Electric")
        self.assertEqual(
            [all_categories[0]["id"]], [category["id"] for category in response]
        )

        all_categories, response = self.execute_query(querystring="query=bik")
        self.assertEqual(
            [all_categories[i]["id"] for i in [2, 1]],
            [category["id"] for category in response],
        )
