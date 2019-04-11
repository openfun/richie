"""
Tests for the category viewset
"""
from unittest import mock

from django.test import TestCase

from elasticsearch.exceptions import NotFoundError
from rest_framework.test import APIRequestFactory

from richie.apps.search import ES_CLIENT
from richie.apps.search.viewsets.categories import CategoriesViewSet


class CategoriesViewsetsTestCase(TestCase):
    """
    Test the API endpoints for categories (list and details)
    """

    def test_viewsets_categories_retrieve(self):
        """
        Happy path: the client requests an existing category, gets it back
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/categories/42")

        with mock.patch.object(
            ES_CLIENT,
            "get",
            return_value={
                "_id": 42,
                "_source": {
                    "is_meta": True,
                    "logo": {"fr": "/image42.png"},
                    "nb_children": 1,
                    "path": "0001",
                    "title": {"fr": "Some Category"},
                },
            },
        ):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = CategoriesViewSet.as_view({"get": "retrieve"})(
                request, 42, version="1.0"
            )

        # The client received a proper response with the relevant category
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "id": 42,
                "is_meta": True,
                "logo": "/image42.png",
                "nb_children": 1,
                "path": "0001",
                "title": "Some Category",
            },
        )

    def test_viewsets_categories_retrieve_unknown(self):
        """
        Error case: the client is asking for a category that does not exist
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/categories/43")

        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(ES_CLIENT, "get", side_effect=NotFoundError):
            response = CategoriesViewSet.as_view({"get": "retrieve"})(
                request, 43, version="1.0"
            )

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @mock.patch(
        "richie.apps.search.forms.ItemSearchForm.build_es_query",
        lambda x: (2, 0, {"query": "example"}),
    )
    @mock.patch.object(ES_CLIENT, "search")
    def test_viewsets_categories_search(self, mock_search):
        """
        Happy path: the category is filtering the categories by name
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/category?query=Science&limit=2")

        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": 21,
                        "_source": {
                            "is_meta": True,
                            "logo": {"fr": "/image21.png"},
                            "nb_children": 1,
                            "path": "0002",
                            "title": {"fr": "Computer Science"},
                        },
                    },
                    {
                        "_id": 61,
                        "_source": {
                            "is_meta": False,
                            "logo": {"fr": "/image61.png"},
                            "nb_children": 0,
                            "path": "00020001",
                            "title": {"fr": "Engineering Sciences"},
                        },
                    },
                ],
                "total": 32,
            }
        }

        response = CategoriesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 32},
                "objects": [
                    {
                        "id": 21,
                        "is_meta": True,
                        "logo": "/image21.png",
                        "nb_children": 1,
                        "path": "0002",
                        "title": "Computer Science",
                    },
                    {
                        "id": 61,
                        "is_meta": False,
                        "logo": "/image61.png",
                        "nb_children": 0,
                        "path": "00020001",
                        "title": "Engineering Sciences",
                    },
                ],
            },
        )
        # The ES connector was called with a query that matches the client's request
        mock_search.assert_called_with(
            _source=[
                "absolute_url",
                "is_meta",
                "logo",
                "nb_children",
                "path",
                "title.*",
            ],
            body={"query": "example"},
            doc_type="category",
            from_=0,
            index="richie_categories",
            size=2,
        )

    def test_viewsets_categories_search_with_invalid_params(self):
        """
        Error case: the client used an incorrectly formatted request
        """
        factory = APIRequestFactory()
        # The request contains incorrect params: limit should be a positive integer
        request = factory.get("/api/v1.0/category?name=&limit=-2")

        response = CategoriesViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
