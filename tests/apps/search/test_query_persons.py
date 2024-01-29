"""Tests for actual searches for persons."""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.persons import PersonsIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

PERSONS = [
    {"id": "5918", "title": {"en": "John Brown"}},
    {"id": "5987", "title": {"en": "John Blue"}},
    {"id": "5912", "title": {"en": "Jaåsōn Gold"}},
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

    def execute_query(self, persons=None, querystring=""):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class: create and fill the
        index with our persons so we can run our queries and check the results.
        It also executes the query and returns the result from the API.
        """
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index="test_persons")
        ES_INDICES_CLIENT.close(index="test_persons")
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="test_persons")
        ES_INDICES_CLIENT.open(index="test_persons")

        # Use the default persons mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(body=PersonsIndexer.mapping, index="test_persons")

        # Actually insert our persons in the index
        actions = [
            {
                "_id": person["id"],
                "_index": "test_persons",
                "_op_type": "create",
                "absolute_url": {"en": "en/url"},
                "bio": {"en": "en/bio"},
                "portrait": {"en": "en/image"},
                "title_raw": person["title"],
                **person,
            }
            for person in persons or PERSONS
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

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
                    {"id": "5912", "portrait": "en/image", "title": "Jaåsōn Gold"},
                    {"id": "5987", "portrait": "en/image", "title": "John Blue"},
                    {"id": "5918", "portrait": "en/image", "title": "John Brown"},
                ],
            },
        )

    def test_query_persons_by_text(self, *_):
        """
        Make sure only persons matching the text query are returned.
        """
        # Make a query without diacritics for an object with diacritics in its title
        content = self.execute_query(querystring="query=jaason")
        self.assertEqual(
            content,
            {
                "meta": {"count": 1, "offset": 0, "total_count": 1},
                "objects": [
                    {"id": "5912", "portrait": "en/image", "title": "Jaåsōn Gold"}
                ],
            },
        )
        # Make a query with diacritics for an object without diacritics in its title
        content = self.execute_query(querystring="query=jõhń")
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

    def test_query_persons_empty_content(self, *_):
        """
        Make sure no 500 error is raised if an empty person is indexed.
        """
        content = self.execute_query(
            persons=[
                {
                    "id": "1234",
                    "title": {},
                    "absolute_url": {},
                    "bio": {},
                    "portrait": {},
                }
            ]
        )
        self.assertEqual(
            content,
            {
                "meta": {"count": 1, "offset": 0, "total_count": 1},
                "objects": [
                    {
                        "id": "1234",
                        "portrait": None,
                        "title": None,
                    },
                ],
            },
        )
