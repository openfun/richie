"""
Tests for the subject indexer
"""
from django.conf import settings
from django.test import TestCase

import responses

from richie.apps.search.exceptions import IndexerDataException
from richie.apps.search.indexers.subjects import SubjectsIndexer


class SubjectsIndexerTestCase(TestCase):
    """
    Test the get_data_for_es() function on the subject indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @responses.activate
    def test_get_data_for_es(self):
        """
        Happy path: the data is fetched from the API properly formatted
        """
        responses.add(
            method="GET",
            url=settings.SUBJECT_API_ENDPOINT + "?page=1&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {"id": 62, "image": "example_cs.png", "name": "Computer Science"}
                ],
            },
        )

        responses.add(
            method="GET",
            url=settings.SUBJECT_API_ENDPOINT + "?page=2&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {
                        "id": 64,
                        "image": "example_se.png",
                        "name": "Software Engineering",
                    }
                ],
            },
        )

        indexer = SubjectsIndexer()

        # The results were properly formatted and passed to the consumer
        self.assertEqual(
            list(indexer.get_data_for_es(index="some_index", action="some_action")),
            [
                {
                    "_id": 62,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "subject",
                    "image": "example_cs.png",
                    "name": {"fr": "Computer Science"},
                },
                {
                    "_id": 64,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "subject",
                    "image": "example_se.png",
                    "name": {"fr": "Software Engineering"},
                },
            ],
        )

    @responses.activate
    def test_get_data_for_es_with_unexpected_subject_shape(self):
        """
        Error case: the API returned an object that is not shaped like an expected subject
        """
        responses.add(
            method="GET",
            url=settings.SUBJECT_API_ENDPOINT,
            status=200,
            json={
                "count": 1,
                "results": [
                    {
                        "id": 62,
                        # 'name': 'Lambda Calculus', missing name key will trigger the KeyError
                        "image": "example_lc.png",
                    }
                ],
            },
        )

        indexer = SubjectsIndexer()

        with self.assertRaises(IndexerDataException):
            list(indexer.get_data_for_es(index="some_index", action="some_action"))

    def test_format_es_subject_for_api(self):
        """
        Make sure format_es_subject_for_api returns a properly formatted subject
        """
        es_subject = {
            "_id": 89,
            "_source": {
                "image": "example.com/image.png",
                "name": {"en": "Computer science", "fr": "Informatique"},
            },
        }
        self.assertEqual(
            SubjectsIndexer.format_es_subject_for_api(es_subject, "en"),
            {"id": 89, "image": "example.com/image.png", "name": "Computer science"},
        )
