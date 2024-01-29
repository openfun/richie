"""
Tests for organization autocomplete
"""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS
from richie.apps.search.utils.indexers import slice_string_for_completion

ORGANIZATIONS_INDEX = "test_organizations"


@mock.patch.object(  # Plug the test index we're filling on the indexer itself
    OrganizationsIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value=ORGANIZATIONS_INDEX,
)
class AutocompleteOrganizationsTestCase(TestCase):
    """
    Test organization autocomplete queries in a real-world situation with ElasticSearch.
    """

    def execute_query(self, querystring="", **extra):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        organizations = [
            {
                "complete": {
                    "en": slice_string_for_completion("University of Paris 18"),
                    "fr": slice_string_for_completion("Université de Paris 18"),
                },
                "id": "25",
                "path": "000000",
                "title": {
                    "en": "University of Paris 18",
                    "fr": "Université de Paris 18",
                },
            },
            {
                "complete": {
                    "en": slice_string_for_completion("School of bikeshedding"),
                    "fr": slice_string_for_completion("École d'abri-vélo"),
                },
                "id": "34",
                "path": "000001",
                "title": {"en": "School of bikeshedding", "fr": "École d'abri-vélo"},
            },
            {
                "complete": {
                    "en": slice_string_for_completion("University of Paris 19"),
                    "fr": slice_string_for_completion("Université de Paris 19"),
                },
                "id": "52",
                "path": "000002",
                "title": {
                    "en": "University of Paris 19",
                    "fr": "Université de Paris 19",
                },
            },
        ]

        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index=ORGANIZATIONS_INDEX)

        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=ORGANIZATIONS_INDEX)
        ES_INDICES_CLIENT.put_settings(
            body=ANALYSIS_SETTINGS, index=ORGANIZATIONS_INDEX
        )
        ES_INDICES_CLIENT.open(index=ORGANIZATIONS_INDEX)

        # Use the default organizations mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=OrganizationsIndexer.mapping,
            index=ORGANIZATIONS_INDEX,
        )
        # Actually insert our organizations in the index
        actions = [
            {
                "_id": organization["id"],
                "_index": ORGANIZATIONS_INDEX,
                "_op_type": "create",
                "absolute_url": {"en": "url"},
                "cover_image": {"en": "image"},
                "is_meta": False,
                "logo": {"en": "/some/img.png"},
                "nb_children": 0,
                **organization,
            }
            for organization in organizations
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        response = self.client.get(
            f"/api/v1.0/organizations/autocomplete/?{querystring:s}", **extra
        )
        self.assertEqual(response.status_code, 200)

        return organizations, json.loads(response.content)

    def test_autocomplete_missing_query(self, *_):
        """
        When the query is missing, the API returns a 400 error with an appropriate error.
        """
        response = self.client.get("/api/v1.0/organizations/autocomplete/?")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    'Missing autocomplete "query" for request to test_organizations.'
                ]
            },
        )

    def test_autocomplete_text(self, *_):
        """
        Make sure autocomplete is operational and returns the expected organizations.
        """
        all_organizations, response = self.execute_query(querystring="query=Paris")
        self.assertEqual(
            [all_organizations[i]["id"] for i in [0, 2]],
            [organization["id"] for organization in response],
        )

        all_organizations, response = self.execute_query(querystring="query=bik")
        self.assertEqual(
            [all_organizations[1]["id"]],
            [organization["id"] for organization in response],
        )

    def test_autocomplete_diacritics_insensitive_query(self, *_):
        """
        Queries are diacritics insensitive.
        """
        all_organizations, response = self.execute_query(querystring="query=Üñî")
        self.assertEqual(
            [all_organizations[i]["id"] for i in [0, 2]],
            [organization["id"] for organization in response],
        )

    def test_autocomplete_diacritics_insensitive_index(self, *_):
        """
        Index is diacritics insensitive.
        """
        all_organizations, response = self.execute_query(
            querystring="query=universite", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual(
            [all_organizations[i]["id"] for i in [0, 2]],
            [organization["id"] for organization in response],
        )

        # Sanity check for original, accented version
        all_organizations, response = self.execute_query(
            querystring="query=École", HTTP_ACCEPT_LANGUAGE="fr"
        )
        self.assertEqual(
            [all_organizations[1]["id"]],
            [organization["id"] for organization in response],
        )
