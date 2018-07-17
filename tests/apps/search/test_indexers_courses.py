"""
Tests for the course indexer
"""
from django.conf import settings
from django.test import TestCase

import responses

from richie.apps.search.exceptions import IndexerDataException
from richie.apps.search.indexers.courses import CoursesIndexer


class CoursesIndexerTestCase(TestCase):
    """
    Test the get_data_for_es() function on the course indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @responses.activate
    def test_get_data_for_es(self):
        """
        Happy path: the data is fetched from the API properly formatted
        """
        responses.add(
            method="GET",
            url=settings.COURSE_API_ENDPOINT + "?page=1&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {
                        "end_date": "2018-02-28T06:00:00Z",
                        "enrollment_end_date": "2018-01-31T06:00:00Z",
                        "enrollment_start_date": "2018-01-01T06:00:00Z",
                        "id": 42,
                        "language": "fr",
                        "main_university": {"id": 21},
                        "session_number": 6,
                        "short_description": "Lorem ipsum dolor sit amet",
                        "start_date": "2018-02-01T06:00:00Z",
                        "subjects": [{"id": 168}, {"id": 336}],
                        "thumbnails": {"big": "whatever.png"},
                        "title": "A course in filler text",
                        "universities": [{"id": 21}, {"id": 84}],
                    }
                ],
            },
        )

        responses.add(
            method="GET",
            url=settings.COURSE_API_ENDPOINT + "?page=2&rpp=50",
            match_querystring=True,
            json={
                "count": 51,
                "results": [
                    {
                        "end_date": "2019-02-28T06:00:00Z",
                        "enrollment_end_date": "2019-01-31T06:00:00Z",
                        "enrollment_start_date": "2019-01-01T06:00:00Z",
                        "id": 44,
                        "language": "en",
                        "main_university": {"id": 22},
                        "session_number": 1,
                        "short_description": "Consectetur adipiscim elit",
                        "start_date": "2019-02-01T06:00:00Z",
                        "subjects": [{"id": 176}, {"id": 352}],
                        "thumbnails": {"big": "whatever_else.png"},
                        "title": "Filler text 102",
                        "universities": [{"id": 22}, {"id": 88}],
                    }
                ],
            },
        )

        # The results were properly formatted and passed to the consumer
        self.assertEqual(
            list(
                CoursesIndexer.get_data_for_es(index="some_index", action="some_action")
            ),
            [
                {
                    "_id": 42,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "course",
                    "end_date": "2018-02-28T06:00:00Z",
                    "enrollment_end_date": "2018-01-31T06:00:00Z",
                    "enrollment_start_date": "2018-01-01T06:00:00Z",
                    "language": "fr",
                    "organization_main": 21,
                    "organizations": [21, 84],
                    "session_number": 6,
                    "short_description": {"fr": "Lorem ipsum dolor sit amet"},
                    "start_date": "2018-02-01T06:00:00Z",
                    "subjects": [168, 336],
                    "thumbnails": {"big": "whatever.png"},
                    "title": {"fr": "A course in filler text"},
                },
                {
                    "_id": 44,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "course",
                    "end_date": "2019-02-28T06:00:00Z",
                    "enrollment_end_date": "2019-01-31T06:00:00Z",
                    "enrollment_start_date": "2019-01-01T06:00:00Z",
                    "language": "en",
                    "organization_main": 22,
                    "organizations": [22, 88],
                    "session_number": 1,
                    "short_description": {"en": "Consectetur adipiscim elit"},
                    "start_date": "2019-02-01T06:00:00Z",
                    "subjects": [176, 352],
                    "thumbnails": {"big": "whatever_else.png"},
                    "title": {"en": "Filler text 102"},
                },
            ],
        )

    @responses.activate
    def test_get_data_for_es_with_unexpected_data_shape(self):
        """
        Error case: the API returned an object that is not shape like an expected course
        """
        responses.add(
            method="GET",
            url=settings.COURSE_API_ENDPOINT,
            status=200,
            json={
                "count": 1,
                "results": [
                    {
                        "end_date": "2018-02-28T06:00:00Z",
                        "enrollment_end_date": "2018-01-31T06:00:00Z",
                        "enrollment_start_date": "2018-01-01T06:00:00Z",
                        "id": 42,
                        # 'language': 'fr', missing language key will trigger the KeyError
                        "main_university": {"id": 21},
                        "session_number": 6,
                        "short_description": "Lorem ipsum dolor sit amet",
                        "start_date": "2018-02-01T06:00:00Z",
                        "subjects": [{"id": 168}, {"id": 336}],
                        "thumbnails": {"big": "whatever.png"},
                        "title": "A course in filler text",
                        "universities": [{"id": 21}, {"id": 84}],
                    }
                ],
            },
        )

        with self.assertRaises(IndexerDataException):
            list(CoursesIndexer.get_data_for_es(index="some_index", action="some_action"))

    def test_format_es_course_for_api(self):
        """
        Make sure format_es_course_for_api returns a properly formatted course
        """
        es_course = {
            "_id": 93,
            "_source": {
                "end_date": "2018-02-28T06:00:00Z",
                "enrollment_end_date": "2018-01-31T06:00:00Z",
                "enrollment_start_date": "2018-01-01T06:00:00Z",
                "language": "en",
                "organization_main": 42,
                "organizations": [42, 84],
                "session_number": 1,
                "short_description": {
                    "en": "Nam aliquet, arcu at sagittis sollicitudin."
                },
                "start_date": "2018-02-01T06:00:00Z",
                "subjects": [43, 86],
                "thumbnails": {"big": "whatever_else.png"},
                "title": {"en": "Duis eu arcu erat"},
            },
        }
        self.assertEqual(
            CoursesIndexer.format_es_course_for_api(es_course, "en"),
            {
                "end_date": "2018-02-28T06:00:00Z",
                "enrollment_end_date": "2018-01-31T06:00:00Z",
                "enrollment_start_date": "2018-01-01T06:00:00Z",
                "id": 93,
                "language": "en",
                "organization_main": 42,
                "organizations": [42, 84],
                "session_number": 1,
                "short_description": "Nam aliquet, arcu at sagittis sollicitudin.",
                "start_date": "2018-02-01T06:00:00Z",
                "subjects": [43, 86],
                "thumbnails": {"big": "whatever_else.png"},
                "title": "Duis eu arcu erat",
            },
        )
