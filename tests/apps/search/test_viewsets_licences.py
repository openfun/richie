"""
Tests for the licence viewset
"""

from unittest import mock

from django.test import TestCase
from django.test.utils import override_settings

from elasticsearch.exceptions import NotFoundError

from richie.apps.search import ES_CLIENT


class LicencesViewsetsTestCase(TestCase):
    """
    Test the API endpoints for licences (list and details)
    """

    def test_viewsets_licences_retrieve(self):
        """
        Happy path: the client requests an existing licence, gets it back
        """
        with mock.patch.object(
            ES_CLIENT,
            "get",
            return_value={
                "_id": 42,
                "_source": {
                    "title": {"fr": "creative commons"},
                },
            },
        ):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = self.client.get("/api/v1.0/licences/42/")

        # The client received a proper response with the relevant licence
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"id": 42, "title": "creative commons"},
        )

    def test_viewsets_licences_retrieve_unknown(self):
        """
        Error case: the client is asking for an licence that does not exist
        """
        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(ES_CLIENT, "get", side_effect=NotFoundError):
            response = self.client.get("/api/v1.0/licences/43/", follow=True)

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @override_settings(RICHIE_ES_INDICES_PREFIX="richie")
    @mock.patch.object(ES_CLIENT, "search")
    def test_viewsets_licences_search(self, mock_search):
        """
        Happy path: the consumer is filtering the licences by title
        """
        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": 21,
                        "_source": {
                            "title": {"fr": "licence creative commons"},
                        },
                    },
                    {
                        "_id": 61,
                        "_source": {
                            "title": {"fr": "licence commerciale"},
                        },
                    },
                ],
                "total": {"relation": "eq", "value": 32},
            }
        }

        response = self.client.get("/api/v1.0/licences/?query=licence&limit=2")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 32},
                "objects": [
                    {"id": 21, "title": "licence creative commons"},
                    {"id": 61, "title": "licence commerciale"},
                ],
            },
        )
        # The ES connector was called with a query that matches the client's request
        mock_search.assert_called_with(
            _source=["id", "title"],
            body={
                "query": {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "analyzer": "english",
                                    "fields": ["content.*", "title.*"],
                                    "query": "licence",
                                }
                            }
                        ]
                    }
                },
                "sort": [{"title_raw.en": {"order": "asc"}}],
            },
            from_=0,
            index="richie_licences",
            size=2,
        )

    def test_viewsets_licences_search_with_invalid_params(self):
        """
        Error case: the client used an incorrectly formatted request
        """
        # The request contains incorrect params: limit should be a positive integer
        response = self.client.get("/api/v1.0/licences/?title=&limit=-2")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
