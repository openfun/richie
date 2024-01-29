"""
Tests for person autocomplete
"""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.persons import PersonsIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS
from richie.apps.search.utils.indexers import slice_string_for_completion

PERSONS_INDEX = "test_persons"


@mock.patch.object(  # Plug the test index we're filling on the indexer itself
    PersonsIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value=PERSONS_INDEX,
)
class AutocompletePersonsTestCase(TestCase):
    """
    Test person autocomplete queries in a real-world situation with ElasticSearch.
    """

    def execute_query(self, querystring="", **extra):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        persons = [
            {
                "complete": {"en": slice_string_for_completion("Éponine Thénardier")},
                "id": "25",
                "title": {"en": "Éponine Thénardier"},
            },
            {
                "complete": {
                    "en": slice_string_for_completion("Monseigneur Bienvenu Myriel")
                },
                "id": "34",
                "title": {"en": "Monseigneur Bienvenu Myriel"},
            },
            {
                "complete": {"en": slice_string_for_completion("Fantine")},
                "id": "52",
                "title": {"en": "Fantine"},
            },
        ]

        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index=PERSONS_INDEX)

        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=PERSONS_INDEX)
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=PERSONS_INDEX)
        ES_INDICES_CLIENT.open(index=PERSONS_INDEX)

        # Use the default persons mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(body=PersonsIndexer.mapping, index=PERSONS_INDEX)

        # Actually insert our persons in the index
        actions = [
            {
                "_id": person["id"],
                "_index": PERSONS_INDEX,
                "_op_type": "create",
                "absolute_url": {"en": "url"},
                "logo": {"en": "/some/img.png"},
                **person,
            }
            for person in persons
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        response = self.client.get(
            f"/api/v1.0/persons/autocomplete/?{querystring:s}", **extra
        )
        self.assertEqual(response.status_code, 200)

        return persons, json.loads(response.content)

    def test_autocomplete_missing_query(self, *_):
        """
        When the query is missing, the API returns a 400 error with an appropriate error.
        """
        response = self.client.get("/api/v1.0/persons/autocomplete/?")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ['Missing autocomplete "query" for request to test_persons.']},
        )

    def test_autocomplete_text(self, *_):
        """
        Make sure autocomplete is operational and returns the expected persons.
        """
        all_persons, response = self.execute_query(querystring="query=Bien")
        self.assertEqual([all_persons[1]["id"]], [person["id"] for person in response])

        all_persons, response = self.execute_query(querystring="query=épo")
        self.assertEqual([all_persons[0]["id"]], [person["id"] for person in response])

    def test_autocomplete_diacritics_insensitive_query(self, *_):
        """
        Queries are diacritics insensitive.
        """
        all_persons, response = self.execute_query(querystring="query=Mônsé")
        self.assertEqual([all_persons[1]["id"]], [person["id"] for person in response])

    def test_autocomplete_diacritics_insensitive_index(self, *_):
        """
        Index is diacritics insensitive.
        """
        all_persons, response = self.execute_query(querystring="query=eponine")
        self.assertEqual([all_persons[0]["id"]], [person["id"] for person in response])

        # Sanity check for original, accented version
        all_persons, response = self.execute_query(querystring="query=Thénardier")
        self.assertEqual([all_persons[0]["id"]], [person["id"] for person in response])
