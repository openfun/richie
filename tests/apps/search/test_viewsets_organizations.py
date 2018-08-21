"""
Tests for the organization viewset
"""
from unittest import mock

from django.conf import settings
from django.test import TestCase

from elasticsearch.exceptions import NotFoundError
from rest_framework.test import APIRequestFactory

from richie.apps.search.exceptions import QueryFormatException
from richie.apps.search.viewsets.organizations import OrganizationsViewSet


class OrganizationsViewsetsTestCase(TestCase):
    """
    Test the API endpoints for organizations (list and details)
    """

    def test_viewsets_organizations_retrieve(self):
        """
        Happy path: the client requests an existing organization, gets it back
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/organizations/42")

        with mock.patch.object(
            settings.ES_CLIENT,
            "get",
            return_value={
                "_id": 42,
                "_source": {
                    "banner": "example.com/banner.png",
                    "code": "univ-paris-42",
                    "logo": "example.com/logo.png",
                    "name": {"fr": "Université Paris 42"},
                },
            },
        ):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = OrganizationsViewSet.as_view({"get": "retrieve"})(
                request, 42, version="1.0"
            )

        # The client received a proper response with the relevant organization
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "banner": "example.com/banner.png",
                "code": "univ-paris-42",
                "id": 42,
                "logo": "example.com/logo.png",
                "name": "Université Paris 42",
            },
        )

    def test_viewsets_organizations_retrieve_unknown(self):
        """
        Error case: the client is asking for an organization that does not exist
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/organizations/43")

        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(settings.ES_CLIENT, "get", side_effect=NotFoundError):
            response = OrganizationsViewSet.as_view({"get": "retrieve"})(
                request, 43, version="1.0"
            )

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @mock.patch(
        "richie.apps.search.indexers.organizations.OrganizationsIndexer.build_es_query",
        lambda x: (2, 0, {"query": "something"}),
    )
    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_viewsets_organizations_search(self, mock_search):
        """
        Happy path: the consumer is filtering the organizations by name
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/organizations?query=Université&limit=2")

        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": 21,
                        "_source": {
                            "banner": "example.com/banner_21.png",
                            "code": "univ-paris-13",
                            "logo": "example.com/logo_21.png",
                            "name": {"fr": "Université Paris 13"},
                        },
                    },
                    {
                        "_id": 61,
                        "_source": {
                            "banner": "example.com/banner_61.png",
                            "code": "univ-paris-8",
                            "logo": "example.com/logo_61.png",
                            "name": {"fr": "Université Paris 8"},
                        },
                    },
                ],
                "total": 32,
            }
        }

        response = OrganizationsViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 32},
                "objects": [
                    {
                        "banner": "example.com/banner_21.png",
                        "code": "univ-paris-13",
                        "id": 21,
                        "logo": "example.com/logo_21.png",
                        "name": "Université Paris 13",
                    },
                    {
                        "banner": "example.com/banner_61.png",
                        "code": "univ-paris-8",
                        "id": 61,
                        "logo": "example.com/logo_61.png",
                        "name": "Université Paris 8",
                    },
                ],
            },
        )
        # The ES connector was called with a query that matches the client's request
        mock_search.assert_called_with(
            body={"query": "something"},
            doc_type="organization",
            from_=0,
            index="richie_organizations",
            size=2,
        )

    @mock.patch(
        "richie.apps.search.indexers.organizations.OrganizationsIndexer.build_es_query",
        side_effect=QueryFormatException({"limit": "incorrect value"}),
    )
    def test_viewsets_organizations_search_with_invalid_params(self, _):
        """
        Error case: the client used an incorrectly formatted request
        """
        factory = APIRequestFactory()
        # The request contains incorrect params: limit should be a positive integer
        request = factory.get("/api/v1.0/organizations?name=&limit=-2")

        response = OrganizationsViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
