"""Tests for the ElasticSearch compatibility layer."""
from unittest import mock

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

CATEGORIES = [
    {"id": "8312", "kind": "subjects", "title": {"en": "Literature"}},
    {"id": "8399", "kind": "subjects", "title": {"en": "Science for beginners"}},
    {"id": "8421", "kind": "levels", "title": {"en": "Bégînnêr"}},
    {"id": "8476", "kind": "levels", "title": {"en": "Expert"}},
]


class ElasticSearchCompatLayerTestCase(TestCase):
    """
    Specifically test the compatibility layer that allows Richie to function with
    different versions of ElasticSearch.
    """

    @mock.patch(
        "elasticsearch.Elasticsearch.info",
        return_value={"should not be called": "the value is cached"},
    )
    def test_cache_version_information(self, mock_es_info):
        """
        Make sure we only ever make the info() call once even if we use more than
        one ElasticSearch API endpoint.
        """

        # Perform a bunch of ES actions, from index management all the way to searches
        ES_INDICES_CLIENT.delete(index="_all")
        ES_INDICES_CLIENT.create(index="test_categories")
        ES_INDICES_CLIENT.close(index="test_categories")
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="test_categories")
        ES_INDICES_CLIENT.open(index="test_categories")
        ES_INDICES_CLIENT.put_mapping(
            body=CategoriesIndexer.mapping, index="test_categories"
        )

        actions = [
            {
                "_id": category["id"],
                "_index": "test_categories",
                "_op_type": "create",
                "absolute_url": {"en": "en/url"},
                "description": {"en": "en/description"},
                "icon": {"en": "en/icon"},
                "is_meta": False,
                "logo": {"en": "en/logo"},
                "nb_children": 0,
                "path": category["id"],
                "title_raw": category["title"],
                **category,
            }
            for category in CATEGORIES
        ]
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        self.client.get("/api/v1.0/subjects/")
        self.client.get("/api/v1.0/levels/")
        self.client.get("/api/v1.0/subjects/8312/")

        mock_es_info.assert_not_called()
