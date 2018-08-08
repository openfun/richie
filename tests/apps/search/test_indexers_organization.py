"""
Tests for the organization indexer
"""
from types import SimpleNamespace

from django.conf import settings
from django.test import TestCase

import responses

from richie.apps.search.exceptions import IndexerDataException, QueryFormatException
from richie.apps.search.indexers.organizations import OrganizationsIndexer


class OrganizationsIndexerTestCase(TestCase):
    """
    Test the get_data_for_es() function on the organization indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @responses.activate
    def test_get_data_for_es(self):
        """
        Happy path: organization data is fetched from the API properly formatted
        """
        responses.add(
            method="GET",
            url=settings.ORGANIZATION_API_ENDPOINT + "?page=1&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {
                        "id": 1,
                        "banner": "example.com/banner_1.png",
                        "code": "org-1",
                        "logo": "example.com/logo_1.png",
                        "name": "Organization N°1",
                    }
                ],
            },
        )

        responses.add(
            method="GET",
            url=settings.ORGANIZATION_API_ENDPOINT + "?page=2&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {
                        "id": 80,
                        "banner": "example.com/banner_80.png",
                        "code": "org-80",
                        "logo": "example.com/logo_80.png",
                        "name": "Organization N°80",
                    }
                ],
            },
        )

        # The results were properly formatted and passed to the consumer
        self.assertEqual(
            list(
                OrganizationsIndexer.get_data_for_es(
                    index="some_index", action="some_action"
                )
            ),
            [
                {
                    "_id": 1,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "organization",
                    "banner": "example.com/banner_1.png",
                    "code": "org-1",
                    "logo": "example.com/logo_1.png",
                    "name": {"fr": "Organization N°1"},
                },
                {
                    "_id": 80,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "organization",
                    "banner": "example.com/banner_80.png",
                    "code": "org-80",
                    "logo": "example.com/logo_80.png",
                    "name": {"fr": "Organization N°80"},
                },
            ],
        )

    @responses.activate
    def test_get_data_for_es_with_unexpected_organization_shape(self):
        """
        Error case: the API returned an object that is not shaped like an expected organization
        """
        responses.add(
            method="GET",
            url=settings.ORGANIZATION_API_ENDPOINT,
            status=200,
            json={
                "count": 1,
                "results": [
                    {
                        "id": 62,
                        "banner": "example.com/banner_62.png",
                        # 'code': 'org-62', missing code key will trigger the KeyError
                        "logo": "example.com/logo_62.png",
                        "name": {"fr": "Organization N°62"},
                    }
                ],
            },
        )

        with self.assertRaises(IndexerDataException):
            list(
                OrganizationsIndexer.get_data_for_es(
                    index="some_index", action="some_action"
                )
            )

    def test_format_es_organization_for_api(self):
        """
        Make sure format_es_organization_for_api returns a properly formatted organization
        """
        es_organization = {
            "_id": 217,
            "_source": {
                "banner": "example.com/banner.png",
                "code": "univ-paris-13",
                "logo": "example.com/logo.png",
                "name": {"en": "University of Paris XIII", "fr": "Université Paris 13"},
            },
        }
        self.assertEqual(
            OrganizationsIndexer.format_es_organization_for_api(es_organization, "en"),
            {
                "banner": "example.com/banner.png",
                "code": "univ-paris-13",
                "id": 217,
                "logo": "example.com/logo.png",
                "name": "University of Paris XIII",
            },
        )

    def test_build_es_query_search_all_organizations(self):
        """
        Happy path: the expected ES query object is returned
        """
        request = SimpleNamespace(query_params={"limit": 11, "offset": 4})
        self.assertEqual(
            OrganizationsIndexer.build_es_query(request),
            (11, 4, {"query": {"match_all": {}}}),
        )

    def test_build_es_query_search_by_name(self):
        """
        Happy path: the expected ES query object is returned
        """
        request = SimpleNamespace(
            query_params={"limit": 12, "offset": 3, "query": "user entered some text"}
        )
        self.assertEqual(
            OrganizationsIndexer.build_es_query(request),
            (
                12,
                3,
                {
                    "query": {
                        "match": {
                            "name.fr": {
                                "query": "user entered some text",
                                "analyzer": "french",
                            }
                        }
                    }
                },
            ),
        )

    def test_build_es_query_with_invalid_params(self):
        """
        Error case: the request contained invalid parameters
        """
        with self.assertRaises(QueryFormatException):
            OrganizationsIndexer.build_es_query(
                SimpleNamespace(query_params={"limit": "invalid input"})
            )
