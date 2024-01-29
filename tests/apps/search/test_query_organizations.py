"""Tests for actual searches for organizations."""

import json
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

ORGANIZATIONS = [
    {"id": "4214", "title": {"en": "University of Pârïs 14"}},
    {"id": "4209", "title": {"en": "University of Lÿõn VI"}},
    {"id": "4213", "title": {"en": "School of Lorem Ipsum"}},
]


@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    OrganizationsIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_organizations",
)
class OrganizationsQueryTestCase(TestCase):
    """
    Test search queries on organizations.
    """

    def execute_query(self, organizations=None, querystring=""):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class: create and fill the
        index with our organizations so we can run our queries and check the results.
        It also executes the query and returns the result from the API.
        """
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index="test_organizations")
        ES_INDICES_CLIENT.close(index="test_organizations")
        ES_INDICES_CLIENT.put_settings(
            body=ANALYSIS_SETTINGS, index="test_organizations"
        )
        ES_INDICES_CLIENT.open(index="test_organizations")

        # Use the default organizations mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=OrganizationsIndexer.mapping,
            index="test_organizations",
        )

        # Actually insert our organizations in the index
        actions = [
            {
                "_id": organization["id"],
                "_index": "test_organizations",
                "_op_type": "create",
                "absolute_url": {"en": "en/url"},
                "description": {"en": "en/description"},
                "logo": {"en": "en/image"},
                "title_raw": organization["title"],
                **organization,
            }
            for organization in organizations or ORGANIZATIONS
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        response = self.client.get(f"/api/v1.0/organizations/?{querystring:s}")
        self.assertEqual(response.status_code, 200)

        return json.loads(response.content)

    def test_query_all_organizations(self, *_):
        """
        Make sure all organizations are returned when there is no query string.
        """
        content = self.execute_query()
        self.assertEqual(
            content,
            {
                "meta": {"count": 3, "offset": 0, "total_count": 3},
                "objects": [
                    {
                        "id": "4213",
                        "logo": "en/image",
                        "title": "School of Lorem Ipsum",
                    },
                    {
                        "id": "4209",
                        "logo": "en/image",
                        "title": "University of Lÿõn VI",
                    },
                    {
                        "id": "4214",
                        "logo": "en/image",
                        "title": "University of Pârïs 14",
                    },
                ],
            },
        )

    def test_query_organizations_by_text(self, *_):
        """
        Make sure only organizations matching the text query are returned.
        """
        # Make a query without diacritics for an object with diacritics in its title
        content = self.execute_query(querystring="query=univers")
        self.assertEqual(
            content,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 2},
                "objects": [
                    {
                        "id": "4209",
                        "logo": "en/image",
                        "title": "University of Lÿõn VI",
                    },
                    {
                        "id": "4214",
                        "logo": "en/image",
                        "title": "University of Pârïs 14",
                    },
                ],
            },
        )
        # Make a query with diacritics for an object without diacritics in its title
        content = self.execute_query(querystring="query=schøöl")
        self.assertEqual(
            content,
            {
                "meta": {"count": 1, "offset": 0, "total_count": 1},
                "objects": [
                    {"id": "4213", "logo": "en/image", "title": "School of Lorem Ipsum"}
                ],
            },
        )

    def test_query_organizations_empty_content(self, *_):
        """
        Make sure no 500 error is raised if an empty organization is indexed.
        """
        content = self.execute_query(
            organizations=[
                {
                    "id": "1234",
                    "title": {},
                    "absolute_url": {},
                    "description": {},
                    "logo": {},
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
                        "logo": None,
                        "title": None,
                    },
                ],
            },
        )
