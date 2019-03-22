"""
Tests for organization autocomplete
"""
import json
from unittest import mock

from django.conf import settings
from django.test import TestCase

from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.utils.indexers import slice_string_for_completion


@mock.patch.object(  # Plug the test index we're filling on the indexer itself
    OrganizationsIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_organizations",
)
class AutocompleteOrganizationsTestCase(TestCase):
    """
    Test organization autocomplete queries in a real-world situation with ElasticSearch.
    """

    def execute_query(self, querystring=""):
        """
        Not a test.
        Prepare the ElasticSearch index and execute the query in it.
        """

        organizations = [
            {
                "complete": {
                    "en": slice_string_for_completion("University of Paris 18")
                },
                "id": "25",
                "path": "000000",
                "title": {"en": "University of Paris 18"},
            },
            {
                "complete": {
                    "en": slice_string_for_completion("School of bikeshedding")
                },
                "id": "34",
                "path": "000001",
                "title": {"en": "School of bikeshedding"},
            },
            {
                "complete": {
                    "en": slice_string_for_completion("University of Paris 19")
                },
                "id": "52",
                "path": "000002",
                "title": {"en": "University of Paris 19"},
            },
        ]

        indices_client = IndicesClient(client=settings.ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_organizations")
        # Use the default organizations mapping from the Indexer
        indices_client.put_mapping(
            body=OrganizationsIndexer.mapping,
            doc_type="organization",
            index="test_organizations",
        )
        # Actually insert our organizations in the index
        actions = [
            {
                "_id": organization["id"],
                "_index": "test_organizations",
                "_op_type": "create",
                "_type": "organization",
                "absolute_url": {"en": "url"},
                "cover_image": {"en": "image"},
                "is_meta": False,
                "logo": {"en": "/some/img.png"},
                "nb_children": 0,
                **organization,
            }
            for organization in organizations
        ]
        bulk(
            actions=actions,
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
        )
        indices_client.refresh()

        response = self.client.get(
            f"/api/v1.0/organizations/autocomplete/?{querystring:s}"
        )
        self.assertEqual(response.status_code, 200)

        return organizations, json.loads(response.content)

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
