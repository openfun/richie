"""Tests for actual searches for categories."""
import json
from unittest import mock

from django.test import TestCase

from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.search import ES_CLIENT
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

CATEGORIES = [
    {"id": "8312", "kind": "subjects", "title": {"en": "Literature"}},
    {"id": "8399", "kind": "subjects", "title": {"en": "Science for beginners"}},
    {"id": "8421", "kind": "levels", "title": {"en": "Bégînnêr"}},
    {"id": "8476", "kind": "levels", "title": {"en": "Expert"}},
]


@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    CategoriesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_categories",
)
class CategoriesQueryTestCase(TestCase):
    """
    Test search queries on categories.
    """

    def execute_query(self, kind, querystring=""):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class: create and fill the
        index with our categories so we can run our queries and check the results.
        It also executes the query and returns the result from the API.
        """
        # Index these categories in Elasticsearch
        indices_client = IndicesClient(client=ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_categories")
        indices_client.close(index="test_categories")
        indices_client.put_settings(body=ANALYSIS_SETTINGS, index="test_categories")
        indices_client.open(index="test_categories")

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
                "absolute_url": {"en": "en/url"},
                "description": {"en": "en/description"},
                "icon": {"en": "en/icon"},
                "is_meta": False,
                "logo": {"en": "en/logo"},
                "nb_children": 0,
                "path": category["id"],
                **category,
            }
            for category in CATEGORIES
        ]
        bulk(actions=actions, chunk_size=500, client=ES_CLIENT)
        indices_client.refresh()

        response = self.client.get(f"/api/v1.0/{kind:s}/?{querystring:s}")
        self.assertEqual(response.status_code, 200)

        return json.loads(response.content)

    def test_query_all_categories_by_kind(self, *_):
        """
        Make sure all categories of a given kind are returned when there is no text query.
        """
        content = self.execute_query(kind="subjects")
        self.assertEqual(
            content,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 2},
                "objects": [
                    {
                        "icon": "en/icon",
                        "id": "8399",
                        "is_meta": False,
                        "logo": "en/logo",
                        "nb_children": 0,
                        "path": "8399",
                        "title": "Science for beginners",
                    },
                    {
                        "icon": "en/icon",
                        "id": "8312",
                        "is_meta": False,
                        "logo": "en/logo",
                        "nb_children": 0,
                        "path": "8312",
                        "title": "Literature",
                    },
                ],
            },
        )

    def test_query_categories_by_text_and_kind(self, *_):
        """
        Make sure only categories matching the text query and kind are returned.
        """
        # Make a query without diacritics for an object with diacritics in its title
        content = self.execute_query(kind="levels", querystring="query=beginner")
        self.assertEqual(
            content,
            {
                "meta": {"count": 1, "offset": 0, "total_count": 1},
                "objects": [
                    {
                        "icon": "en/icon",
                        "id": "8421",
                        "is_meta": False,
                        "logo": "en/logo",
                        "nb_children": 0,
                        "path": "8421",
                        "title": "Bégînnêr",
                    }
                ],
            },
        )
        # Make a query with diacritics for an object without diacritics in its title
        content = self.execute_query(kind="subjects", querystring="query=lįtérature")
        self.assertEqual(
            content,
            {
                "meta": {"count": 1, "offset": 0, "total_count": 1},
                "objects": [
                    {
                        "icon": "en/icon",
                        "id": "8312",
                        "is_meta": False,
                        "logo": "en/logo",
                        "nb_children": 0,
                        "path": "8312",
                        "title": "Literature",
                    }
                ],
            },
        )
