"""Tests for actual searches for persons."""
import json
from unittest import mock

from django.test import TestCase

from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.search import ES_CLIENT
from richie.apps.search.indexers.persons import PersonsIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

PERSONS = [
    {"id": "5918", "title": {"en": "John Brown"}},
    {"id": "5987", "title": {"en": "John Blue"}},
    {"id": "5912", "title": {"en": "Jåsōn Gold"}},
]


@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    PersonsIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_persons",
)
class PersonsQueryTestCase(TestCase):
    """
    Test search queries on persons.
    """

    def execute_query(self, querystring=""):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class: create and fill the
        index with our persons so we can run our queries and check the results.
        It also executes the query and returns the result from the API.
        """
        # Index these persons in Elasticsearch
        indices_client = IndicesClient(client=ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_persons")
        indices_client.close(index="test_persons")
        indices_client.put_settings(body=ANALYSIS_SETTINGS, index="test_persons")
        indices_client.open(index="test_persons")

        # Use the default persons mapping from the Indexer
        indices_client.put_mapping(
            body=PersonsIndexer.mapping, doc_type="person", index="test_persons"
        )

        # Actually insert our persons in the index
        actions = [
            {
                "_id": person["id"],
                "_index": "test_persons",
                "_op_type": "create",
                "_type": "person",
                "absolute_url": {"en": "en/url"},
                "bio": {"en": "en/bio"},
                "portrait": {"en": "en/image"},
                **person,
            }
            for person in PERSONS
        ]
        bulk(actions=actions, chunk_size=500, client=ES_CLIENT)
        indices_client.refresh()

        response = self.client.get(f"/api/v1.0/persons/?{querystring:s}")
        self.assertEqual(response.status_code, 200)

        return json.loads(response.content)

    def test_query_all_persons(self, *_):
        """
        Make sure all persons are returned when there is no query string.
        """
        content = self.execute_query()
        self.assertEqual(
            content,
            {
                "meta": {"count": 3, "offset": 0, "total_count": 3},
                "objects": [
                    {"id": "5918", "portrait": "en/image", "title": "John Brown"},
                    {"id": "5987", "portrait": "en/image", "title": "John Blue"},
                    {"id": "5912", "portrait": "en/image", "title": "Jåsōn Gold"},
                ],
            },
        )

    def test_query_persons_by_text(self, *_):
        """
        Make sure only persons matching the text query are returned.
        """
        # Make a query without diacritics for an object with diacritics in its title
        content = self.execute_query("query=jason")
        self.assertEqual(
            content,
            {
                "meta": {"count": 1, "offset": 0, "total_count": 1},
                "objects": [
                    {"id": "5912", "portrait": "en/image", "title": "Jåsōn Gold"}
                ],
            },
        )
        # Make a query with diacritics for an object without diacritics in its title
        content = self.execute_query("query=jõhń")
        self.assertEqual(
            content,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 2},
                "objects": [
                    {"id": "5987", "portrait": "en/image", "title": "John Blue"},
                    {"id": "5918", "portrait": "en/image", "title": "John Brown"},
                ],
            },
        )
