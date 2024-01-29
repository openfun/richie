"""Tests for actual searches for licences."""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.licences import LicencesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

LICENCES = [
    {"id": "1", "title": {"en": "CC-BY-SA"}},
    {"id": "2", "title": {"en": "CC-BY-NC"}},
    {"id": "3", "title": {"en": "All Rights Résërvés"}},
]


@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    LicencesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_licences",
)
class LicencesQueryTestCase(TestCase):
    """
    Test search queries on licences.
    """

    def execute_query(self, licences=None, querystring=""):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class: create and fill the
        index with our licences so we can run our queries and check the results.
        It also executes the query and returns the result from the API.
        """
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index="test_licences")
        ES_INDICES_CLIENT.close(index="test_licences")
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="test_licences")
        ES_INDICES_CLIENT.open(index="test_licences")

        # Use the default licences mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=LicencesIndexer.mapping,
            index="test_licences",
        )

        # Actually insert our licences in the index
        actions = [
            {
                "_id": licence["id"],
                "_index": "test_licences",
                "_op_type": "create",
                "title_raw": licence["title"],
                **licence,
            }
            for licence in licences or LICENCES
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        response = self.client.get(f"/api/v1.0/licences/?{querystring:s}")
        self.assertEqual(response.status_code, 200)

        return json.loads(response.content)

    def test_query_all_licences(self, *_):
        """
        Make sure all licences are returned when there is no query string.
        """
        content = self.execute_query()
        self.assertEqual(
            content,
            {
                "meta": {"count": 3, "offset": 0, "total_count": 3},
                "objects": [
                    {"id": "3", "title": "All Rights Résërvés"},
                    {"id": "2", "title": "CC-BY-NC"},
                    {"id": "1", "title": "CC-BY-SA"},
                ],
            },
        )

    def test_query_licences_by_text(self, *_):
        """
        Make sure only licences matching the text query are returned.
        """
        # Make a query without diacritics for an object with diacritics in its title
        content = self.execute_query(querystring="query=CC-")
        self.assertEqual(
            content,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 2},
                "objects": [
                    {"id": "2", "title": "CC-BY-NC"},
                    {"id": "1", "title": "CC-BY-SA"},
                ],
            },
        )
        # Make a query with diacritics to make sure they're ignored
        content = self.execute_query(querystring="query=rêserves")
        self.assertEqual(
            content,
            {
                "meta": {"count": 1, "offset": 0, "total_count": 1},
                "objects": [{"id": "3", "title": "All Rights Résërvés"}],
            },
        )

    def test_query_licences_empty_content(self, *_):
        """
        Make sure no 500 error is raised if an empty licence is indexed.
        """
        content = self.execute_query(
            licences=[
                {
                    "id": "1234",
                    "title": {},
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
                        "title": None,
                    },
                ],
            },
        )
