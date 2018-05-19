"""
Tests for environment ElasticSearch support
"""
from django.conf import settings
from django.test import TestCase
from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk


class ESFeaturesTestCase(TestCase):
    """
    Run some tests on the ES Client itself to ensure all the features we need are supported
    by the version currently made available by the environment.
    The main use for this test is to prevent regressions from a reckless ES version upgrade.
    """

    def setUp(self):
        """
        Make sure tests get clean indexes to run
        """
        self.indices_client = IndicesClient(client=settings.ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        self.indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        self.indices_client.create(index="test_index")
        # Add a mapping for a test document type. It needs to include different fields for the
        # various features we'll be running tests on
        self.indices_client.put_mapping(
            body={
                "properties": {
                    "datetime_field": {"type": "date"},
                    "keyword_field": {"type": "keyword"},
                    "text_field": {"type": "text"},
                }
            },
            doc_type="test_doc",
            index="test_index",
        )

    def test_search_match_all(self):
        """
        Make sure the match all query works as we expect
        """
        # Put our stub data in our empty index. We'll use this data to check the values we
        # get back from ES
        bulk(
            actions=[
                {
                    "_id": 1,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                },
                {
                    "_id": 2,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                },
                {
                    "_id": 3,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                },
            ],
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
            stats_only=True,
        )
        # We need to refresh after bulk indexing before we search the index
        self.indices_client.refresh()
        # Run the actual search and check the results are shaped as we expect
        self.assertEqual(
            settings.ES_CLIENT.search(
                index="test_index",
                doc_type="test_doc",
                body={"sort": ["_id"], "query": {"match_all": {}}},
            )["hits"],
            {
                "total": 3,
                "max_score": None,
                "hits": [
                    {
                        "_id": "1",
                        "_index": "test_index",
                        "_score": None,
                        "_source": {},
                        "_type": "test_doc",
                        "sort": ["1"],
                    },
                    {
                        "_id": "2",
                        "_index": "test_index",
                        "_score": None,
                        "_source": {},
                        "_type": "test_doc",
                        "sort": ["2"],
                    },
                    {
                        "_id": "3",
                        "_index": "test_index",
                        "_score": None,
                        "_source": {},
                        "_type": "test_doc",
                        "sort": ["3"],
                    },
                ],
            },
        )

    def test_search_multimatch_text(self):
        """
        Make sure multi match text queries works as we expect
        """
        # Put our stub data in our empty index. We'll use this data to check the values we
        # get back from ES
        bulk(
            actions=[
                {
                    "_id": 1,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "text_field_a": "Some matching text",
                },
                {
                    "_id": 2,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "text_field_a": "will not be picked up",
                },
                {
                    "_id": 3,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "text_field_b": "Another matching string of text",
                },
            ],
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
            stats_only=True,
        )
        # We need to refresh after bulk indexing before we search the index
        self.indices_client.refresh()
        # Run the actual search and check the results are shaped as we expect
        self.assertEqual(
            settings.ES_CLIENT.search(
                index="test_index",
                doc_type="test_doc",
                body={
                    "query": {
                        "multi_match": {
                            "fields": ["text_field_*"],
                            "query": "matching text",
                            "type": "cross_fields",
                        }
                    }
                },
            )["hits"],
            {
                "total": 2,
                "max_score": 2.7725887,
                "hits": [
                    {
                        "_index": "test_index",
                        "_type": "test_doc",
                        "_id": "1",
                        "_score": 2.7725887,
                        "_source": {"text_field_a": "Some matching text"},
                    },
                    {
                        "_index": "test_index",
                        "_type": "test_doc",
                        "_id": "3",
                        "_score": 2.7725887,
                        "_source": {"text_field_b": "Another matching string of text"},
                    },
                ],
            },
        )

    def test_search_date_ranges(self):
        """
        Make sure date range queries work as we expect
        """
        # Put our stub data in our empty index. We'll use this data to check the values we
        # get back from ES
        bulk(
            actions=[
                {
                    "_id": 1,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "datetime_field": "2018-03-01T12:00:00Z",
                },
                {
                    "_id": 2,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "datetime_field": "2018-03-12T12:00:00Z",
                },
                {
                    "_id": 3,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "datetime_field": "2018-03-23T12:00:00Z",
                },
            ],
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
            stats_only=True,
        )
        # We need to refresh after bulk indexing before we search the index
        self.indices_client.refresh()
        # Run the actual search and check the results are shaped as we expect
        self.assertEqual(
            settings.ES_CLIENT.search(
                index="test_index",
                doc_type="test_doc",
                body={
                    "query": {
                        "range": {
                            "datetime_field": {"gte": "2018-03-05", "lte": "2018-03-15"}
                        }
                    }
                },
            )["hits"],
            {
                "total": 1,
                "max_score": 1.0,
                "hits": [
                    {
                        "_index": "test_index",
                        "_type": "test_doc",
                        "_id": "2",
                        "_score": 1.0,
                        "_source": {"datetime_field": "2018-03-12T12:00:00Z"},
                    }
                ],
            },
        )

    def test_search_terms(self):
        """
        Make sure terms queries works as we expect
        """
        # Put our stub data in our empty index. We'll use this data to check the values we
        # get back from ES
        bulk(
            actions=[
                {
                    "_id": 1,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "keyword_field": ["alpha", "bravo"],
                },
                {
                    "_id": 2,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "keyword_field": ["charlie", "delta", "echo"],
                },
                {
                    "_id": 3,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "keyword_field": ["foxtrot", "golf", "hotel"],
                },
            ],
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
            stats_only=True,
        )
        # We need to refresh after bulk indexing before we search the index
        self.indices_client.refresh()
        # Run the actual search and check the results are shaped as we expect
        self.assertEqual(
            settings.ES_CLIENT.search(
                index="test_index",
                doc_type="test_doc",
                body={"query": {"terms": {"keyword_field": ["alpha", "foxtrot"]}}},
            )["hits"],
            {
                "total": 2,
                "max_score": 1.0,
                "hits": [
                    {
                        "_index": "test_index",
                        "_type": "test_doc",
                        "_id": "1",
                        "_score": 1.0,
                        "_source": {"keyword_field": ["alpha", "bravo"]},
                    },
                    {
                        "_index": "test_index",
                        "_type": "test_doc",
                        "_id": "3",
                        "_score": 1.0,
                        "_source": {"keyword_field": ["foxtrot", "golf", "hotel"]},
                    },
                ],
            },
        )

    def test_search_with_terms_aggregation(self):
        """
        Make sure the terms aggregation works as we expect
        """
        # Put our stub data in our empty index. We'll use this data to check the values we
        # get back from ES
        bulk(
            actions=[
                {
                    "_id": 1,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "keyword_field": ["alpha", "bravo"],
                },
                {
                    "_id": 2,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "keyword_field": ["charlie", "delta", "alpha"],
                },
                {
                    "_id": 3,
                    "_index": "test_index",
                    "_op_type": "create",
                    "_type": "test_doc",
                    "keyword_field": ["delta", "alpha"],
                },
            ],
            chunk_size=settings.ES_CHUNK_SIZE,
            client=settings.ES_CLIENT,
            stats_only=True,
        )
        # We need to refresh after bulk indexing before we search the index
        self.indices_client.refresh()
        # Run the actual search and check the results are shaped as we expect
        self.assertEqual(
            settings.ES_CLIENT.search(
                index="test_index",
                doc_type="test_doc",
                body={
                    "query": {"match_all": {}},
                    "aggs": {"keyword_field": {"terms": {"field": "keyword_field"}}},
                },
            )["aggregations"],
            {
                "keyword_field": {
                    "buckets": [
                        {"doc_count": 3, "key": "alpha"},
                        {"doc_count": 2, "key": "delta"},
                        {"doc_count": 1, "key": "bravo"},
                        {"doc_count": 1, "key": "charlie"},
                    ],
                    "doc_count_error_upper_bound": 0,
                    "sum_other_doc_count": 0,
                }
            },
        )
