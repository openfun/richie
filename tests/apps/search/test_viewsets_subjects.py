"""
Tests for the subject viewset
"""
from unittest import mock

from django.conf import settings
from django.test import TestCase

from elasticsearch.exceptions import NotFoundError
from rest_framework.test import APIRequestFactory

from richie.apps.search.exceptions import QueryFormatException
from richie.apps.search.viewsets.subjects import SubjectsViewSet


class SubjectsViewsetsTestCase(TestCase):
    """
    Test the API endpoints for subjects (list and details)
    """

    def test_viewsets_subjects_retrieve(self):
        """
        Happy path: the client requests an existing subject, gets it back
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/subjects/42")

        with mock.patch.object(
            settings.ES_CLIENT,
            "get",
            return_value={
                "_id": 42,
                "_source": {
                    "logo": {"fr": "/image42.png"},
                    "title": {"fr": "Some Subject"},
                },
            },
        ):
            # Note: we need to use a separate argument for the ID as that is what the ViewSet uses
            response = SubjectsViewSet.as_view({"get": "retrieve"})(
                request, 42, version="1.0"
            )

        # The client received a proper response with the relevant subject
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data, {"id": 42, "logo": "/image42.png", "title": "Some Subject"}
        )

    def test_viewsets_subjects_retrieve_unknown(self):
        """
        Error case: the client is asking for a subject that does not exist
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/subjects/43")

        # Act like the ES client would when we attempt to get a non-existent document
        with mock.patch.object(settings.ES_CLIENT, "get", side_effect=NotFoundError):
            response = SubjectsViewSet.as_view({"get": "retrieve"})(
                request, 43, version="1.0"
            )

        # The client received a standard NotFound response
        self.assertEqual(response.status_code, 404)

    @mock.patch(
        "richie.apps.search.indexers.subjects.SubjectsIndexer.build_es_query",
        lambda x: (2, 0, {"query": "example"}),
    )
    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_viewsets_subjects_search(self, mock_search):
        """
        Happy path: the subject is filtering the subjects by name
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1.0/subject?query=Science&limit=2")

        mock_search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": 21,
                        "_source": {
                            "logo": {"fr": "/image21.png"},
                            "title": {"fr": "Computer Science"},
                        },
                    },
                    {
                        "_id": 61,
                        "_source": {
                            "logo": {"fr": "/image61.png"},
                            "title": {"fr": "Engineering Sciences"},
                        },
                    },
                ],
                "total": 32,
            }
        }

        response = SubjectsViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a properly formatted response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "meta": {"count": 2, "offset": 0, "total_count": 32},
                "objects": [
                    {"id": 21, "logo": "/image21.png", "title": "Computer Science"},
                    {"id": 61, "logo": "/image61.png", "title": "Engineering Sciences"},
                ],
            },
        )
        # The ES connector was called with a query that matches the client's request
        mock_search.assert_called_with(
            _source=["absolute_url", "logo", "title.*"],
            body={"query": "example"},
            doc_type="subject",
            from_=0,
            index="richie_subjects",
            size=2,
        )

    @mock.patch(
        "richie.apps.search.indexers.subjects.SubjectsIndexer.build_es_query",
        side_effect=QueryFormatException({"limit": "incorrect value"}),
    )
    def test_viewsets_subjects_search_with_invalid_params(self, _):
        """
        Error case: the client used an incorrectly formatted request
        """
        factory = APIRequestFactory()
        # The request contains incorrect params: limit should be a positive integer
        request = factory.get("/api/v1.0/subject?name=&limit=-2")

        response = SubjectsViewSet.as_view({"get": "list"})(request, version="1.0")

        # The client received a BadRequest response with the relevant data
        self.assertEqual(response.status_code, 400)
        self.assertTrue("limit" in response.data["errors"])
