"""
Tests for the organization viewset
"""

from unittest import mock

from django.test import TestCase
from django.test.utils import override_settings

from elasticsearch.exceptions import NotFoundError

from richie.apps.search import ES_CLIENT


class OrganizationsViewsetsTestCase(TestCase):
    """
    Test the API endpoints for organizations (list and details)
    """

    def test_viewsets_organizations_retrieve(self):
        """
        Happy path: the client requests an existing organization, gets it back
        """
        with mock.patch.object(
            ES_CLIENT,
            "get",
            return_value={
                "_id": 42,
                "_source": {
                    "logo": {"fr": "/logo.png"},
                    "title": {"fr": "Université Paris 42"},
                },
            },
        ):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = self.client.get("/api/v1.0/organizations/42/")

        # The client received a proper response with the relevant organization
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"id": 42, "logo": "/logo.png", "title": "Université Paris 42"},
        )

    def test_viewsets_organizations_retrieve_unknown(self):
        """
        Error case: the client is asking for an organization that does not exist
        """
        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(ES_CLIENT, "get", side_effect=NotFoundError):
            response = self.client.get("/api/v1.0/organizations/43/", follow=True)

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @override_settings(RICHIE_ES_INDICES_PREFIX="richie")
    @mock.patch.object(ES_CLIENT, "search")
    def test_viewsets_organizations_search(self, mock_search):
        """
        Happy path: the consumer is filtering the organizations by title
        """
        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": 21,
                        "_source": {
                            "logo": {"fr": "/logo_21.png"},
                            "title": {"fr": "Université Paris 13"},
                        },
                    },
                    {
                        "_id": 61,
                        "_source": {
                            "logo": {"fr": "/logo_61.png"},
                            "title": {"fr": "Université Paris 8"},
                        },
                    },
                ],
                "total": {"relation": "eq", "value": 32},
            }
        }

        response = self.client.get("/api/v1.0/organizations/?query=Université&limit=2")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 32},
                "objects": [
                    {"id": 21, "logo": "/logo_21.png", "title": "Université Paris 13"},
                    {"id": 61, "logo": "/logo_61.png", "title": "Université Paris 8"},
                ],
            },
        )
        # The ES connector was called with a query that matches the client's request
        mock_search.assert_called_with(
            _source=["absolute_url", "logo", "title"],
            body={
                "query": {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "analyzer": "english",
                                    "fields": ["title.*"],
                                    "query": "Université",
                                }
                            }
                        ]
                    }
                },
                "sort": [{"title_raw.en": {"order": "asc"}}],
            },
            from_=0,
            index="richie_organizations",
            size=2,
        )

    def test_viewsets_organizations_search_with_invalid_params(self):
        """
        Error case: the client used an incorrectly formatted request
        """
        # The request contains incorrect params: limit should be a positive integer
        response = self.client.get("/api/v1.0/organizations/?title=&limit=-2")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
