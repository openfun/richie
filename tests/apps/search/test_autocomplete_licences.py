"""
Tests for the licences autocomplete endpoint.
"""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.licences import LicencesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS
from richie.apps.search.utils.indexers import slice_string_for_completion

LICENCES_INDEX = "test_licences"


@mock.patch.object(  # Plug the test index we're filling on the indexer itself
    LicencesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value=LICENCES_INDEX,
)
class AutocompleteLicencesTestCase(TestCase):
    """
    Test licence autocomplete queries in a real-world situation with ElasticSearch.
    """

    def execute_query(self, querystring="", **extra):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        licences = [
            {"id": "1", "title": {"en": "CC-BY-SA"}},
            {"id": "2", "title": {"en": "CC-BY-NC"}},
            {"id": "3", "title": {"en": "All Rights Résërvés"}},
        ]

        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index=LICENCES_INDEX)

        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=LICENCES_INDEX)
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=LICENCES_INDEX)
        ES_INDICES_CLIENT.open(index=LICENCES_INDEX)

        # Use the default licences mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=LicencesIndexer.mapping, index=LICENCES_INDEX
        )

        # Actually insert our licences in the index
        actions = [
            {
                "_id": licence["id"],
                "_index": LICENCES_INDEX,
                "_op_type": "create",
                "complete": {"en": slice_string_for_completion(licence["title"]["en"])},
                **licence,
            }
            for licence in licences
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        response = self.client.get(
            f"/api/v1.0/licences/autocomplete/?{querystring:s}", **extra
        )
        self.assertEqual(response.status_code, 200)

        return licences, json.loads(response.content)

    def test_autocomplete_missing_query(self, *_):
        """
        When the query is missing, the API returns a 400 error with an appropriate error.
        """
        response = self.client.get("/api/v1.0/licences/autocomplete/?")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ['Missing autocomplete "query" for request to test_licences.']},
        )

    def test_autocomplete_text(self, *_):
        """
        Make sure autocomplete is operational and returns the expected licences.
        """
        all_licences, response = self.execute_query(querystring="query=CC-BY-N")
        self.assertEqual(
            [all_licences[1]["id"]], [licence["id"] for licence in response]
        )

        all_licences, response = self.execute_query(querystring="query=CC-BY-S")
        self.assertEqual(
            [all_licences[0]["id"]], [licence["id"] for licence in response]
        )

    def test_autocomplete_diacritics_insensitive_query(self, *_):
        """
        Queries are diacritics insensitive.
        """
        all_licences, response = self.execute_query(querystring="query=rêser")
        self.assertEqual(
            [all_licences[2]["id"]], [licence["id"] for licence in response]
        )

    def test_autocomplete_diacritics_insensitive_index(self, *_):
        """
        Index is diacritics insensitive.
        """
        all_licences, response = self.execute_query(querystring="query=reser")
        self.assertEqual(
            [all_licences[2]["id"]], [licence["id"] for licence in response]
        )

        # Sanity check for original, accented version
        all_licences, response = self.execute_query(querystring="query=Résërvés")
        self.assertEqual(
            [all_licences[2]["id"]], [licence["id"] for licence in response]
        )
