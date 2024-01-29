"""
Tests for the person viewset
"""

from unittest import mock

from django.test import TestCase
from django.test.utils import override_settings

from elasticsearch.exceptions import NotFoundError

from richie.apps.search import ES_CLIENT


class PersonsViewSetTestCase(TestCase):
    """
    Test the API endpoints for persons (list and details)
    """

    def test_viewsets_persons_retrieve(self):
        """
        Happy path: the client requests an existing person, gets it back
        """
        with mock.patch.object(
            ES_CLIENT,
            "get",
            return_value={
                "_id": 42,
                "_source": {
                    "portrait": {"fr": "/portrait.png"},
                    "title": {"fr": "Edmond Dantès"},
                },
            },
        ):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = self.client.get("/api/v1.0/persons/42/")

        # The client received a proper response with the relevant person
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"id": 42, "portrait": "/portrait.png", "title": "Edmond Dantès"},
        )

    def test_viewsets_persons_retrieve_unknown(self):
        """
        Error case: the client is asking for an person that does not exist
        """
        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(ES_CLIENT, "get", side_effect=NotFoundError):
            response = self.client.get("/api/v1.0/persons/43/", follow=True)

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @override_settings(RICHIE_ES_INDICES_PREFIX="richie")
    @mock.patch.object(ES_CLIENT, "search")
    def test_viewsets_persons_search(self, mock_search):
        """
        Happy path: the consumer is filtering the persons by title
        """
        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": 21,
                        "_source": {
                            "portrait": {"fr": "/portrait_21.png"},
                            "title": {"fr": "Michel de Montaigne"},
                        },
                    },
                    {
                        "_id": 61,
                        "_source": {
                            "portrait": {"fr": "/portrait_61.png"},
                            "title": {"fr": "Michel Polnareff"},
                        },
                    },
                ],
                "total": {"relation": "eq", "value": 32},
            }
        }

        response = self.client.get("/api/v1.0/persons/?query=Michel&limit=2")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 32},
                "objects": [
                    {
                        "id": 21,
                        "portrait": "/portrait_21.png",
                        "title": "Michel de Montaigne",
                    },
                    {
                        "id": 61,
                        "portrait": "/portrait_61.png",
                        "title": "Michel Polnareff",
                    },
                ],
            },
        )
        # The ES connector was called with a query that matches the client's request
        mock_search.assert_called_with(
            _source=["absolute_url", "portrait", "title"],
            body={
                "query": {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "analyzer": "english",
                                    "fields": ["title.*"],
                                    "query": "Michel",
                                }
                            }
                        ]
                    }
                },
                "sort": [{"title_raw.en": {"order": "asc"}}],
            },
            from_=0,
            index="richie_persons",
            size=2,
        )

    def test_viewsets_persons_search_with_invalid_params(self):
        """
        Error case: the client used an incorrectly formatted request
        """
        # The request contains incorrect params: limit should be a positive integer
        response = self.client.get("/api/v1.0/persons/?title=&limit=-2")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
