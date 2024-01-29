"""
Tests for the category viewset
"""

from unittest import mock

from django.test import TestCase
from django.test.utils import override_settings

from elasticsearch.exceptions import NotFoundError

from richie.apps.search import ES_CLIENT


class CategoriesViewsetsTestCase(TestCase):
    """
    Test the API endpoints for categories (list and details)
    """

    def test_viewsets_categories_retrieve(self):
        """
        Happy path: the client requests an existing category, gets it back
        """
        with mock.patch.object(
            ES_CLIENT,
            "get",
            return_value={
                "_id": 42,
                "_source": {
                    "icon": {"fr": "/icon42.png"},
                    "is_meta": True,
                    "logo": {"fr": "/logo42.png"},
                    "nb_children": 1,
                    "path": "0001",
                    "title": {"fr": "Some Category"},
                },
            },
        ):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = self.client.get("/api/v1.0/categories/42/")

        # The client received a proper response with the relevant category
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "icon": "/icon42.png",
                "id": 42,
                "is_meta": True,
                "logo": "/logo42.png",
                "nb_children": 1,
                "path": "0001",
                "title": "Some Category",
            },
        )

    def test_viewsets_categories_retrieve_unknown(self):
        """
        Error case: the client is asking for a category that does not exist
        """
        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(ES_CLIENT, "get", side_effect=NotFoundError):
            response = self.client.get("/api/v1.0/categories/43/", follow=True)

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @override_settings(RICHIE_ES_INDICES_PREFIX="richie")
    @mock.patch.object(ES_CLIENT, "search")
    def test_viewsets_categories_search(self, mock_search):
        """
        Happy path: the category is filtering the categories by name
        """
        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": 21,
                        "_source": {
                            "icon": {"fr": "/icon21.png"},
                            "is_meta": True,
                            "logo": {"fr": "/logo21.png"},
                            "nb_children": 1,
                            "path": "0002",
                            "title": {"fr": "Computer Science"},
                        },
                    },
                    {
                        "_id": 61,
                        "_source": {
                            "icon": {"fr": "/icon61.png"},
                            "is_meta": False,
                            "logo": {"fr": "/logo61.png"},
                            "nb_children": 0,
                            "path": "00020001",
                            "title": {"fr": "Engineering Sciences"},
                        },
                    },
                ],
                "total": {"relation": "eq", "value": 32},
            }
        }

        response = self.client.get("/api/v1.0/subjects/?query=Science&limit=2")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 32},
                "objects": [
                    {
                        "icon": "/icon21.png",
                        "id": 21,
                        "is_meta": True,
                        "logo": "/logo21.png",
                        "nb_children": 1,
                        "path": "0002",
                        "title": "Computer Science",
                    },
                    {
                        "icon": "/icon61.png",
                        "id": 61,
                        "is_meta": False,
                        "logo": "/logo61.png",
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
                "icon",
                "is_meta",
                "logo",
                "nb_children",
                "path",
                "title",
            ],
            body={
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"kind": "subjects"}},
                            {
                                "multi_match": {
                                    "analyzer": "english",
                                    "fields": ["title.*"],
                                    "query": "Science",
                                }
                            },
                        ]
                    }
                },
                "sort": [{"title_raw.en": {"order": "asc"}}],
            },
            from_=0,
            index="richie_categories",
            size=2,
        )

    def test_viewsets_categories_search_with_invalid_params(self):
        """
        Error case: the client used an incorrectly formatted request
        """
        # The request contains incorrect params: limit should be a positive integer
        response = self.client.get("/api/v1.0/subjects/?name=&limit=-2")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])

    def test_viewsets_categories_catchall_retrieve(self):
        """
        Error case: unrelated requests end up in the categories ViewSet.
        Since the categories ViewSet sits on a catchall URL, we need to make sure it returns
        proper errors and does not raise eg. a 500 when called from an unexpected URL.
        """
        # The request is for a user instead of a category
        response = self.client.get("/api/v1.0/users/42/", follow=True)
        self.assertEqual(response.status_code, 404)

    def test_viewsets_categories_catchall_search(self):
        """
        Error case: unrelated requests end up in the categories ViewSet.
        Since the categories ViewSet sits on a catchall URL, we need to make sure it returns
        proper errors and does not raise eg. a 500 when called from an unexpected URL.
        """
        # The request is for users instead of categories
        response = self.client.get("/api/v1.0/users/", follow=True)
        self.assertEqual(response.status_code, 404)
