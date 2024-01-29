"""Tests for the ElasticSearch compatibility layer."""

from unittest import mock

from django.conf import settings
from django.test import TestCase

from richie.apps.search.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
    bulk_compat,
)
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS
from richie.apps.search.utils.indexers import slice_string_for_completion

CATEGORIES = [
    {
        "id": "8312",
        "kind": "subjects",
        "title": {"en": "Literature"},
        "complete": {"en": slice_string_for_completion("Literature")},
    },
    {
        "id": "8399",
        "kind": "subjects",
        "title": {"en": "Science for beginners"},
        "complete": {"en": slice_string_for_completion("Science for beginners")},
    },
    {
        "id": "8421",
        "kind": "levels",
        "title": {"en": "Bégînnêr"},
        "complete": {"en": slice_string_for_completion("Bégînnêr")},
    },
    {
        "id": "8476",
        "kind": "levels",
        "title": {"en": "Expert"},
        "complete": {"en": slice_string_for_completion("Expert")},
    },
]


class ElasticSearchCompatLayerTestCase(TestCase):
    """
    Specifically test the compatibility layer that allows Richie to function with
    different versions of ElasticSearch.
    """

    @mock.patch.object(
        CategoriesIndexer,
        "index_name",
        new_callable=mock.PropertyMock,
        return_value="test_categories",
    )
    def test_cache_version_information(self, *_):
        """
        Make sure we only ever make the info() call once by instance
        even if we use more than one ElasticSearch API endpoint.
        """

        # - Use a fresh ES client instance to be sure that __es_version__ has
        #   not been called yet
        es_client = ElasticsearchClientCompat7to6(
            getattr(settings, "RICHIE_ES_HOST", ["elasticsearch"])
        )
        es_indices_client = ElasticsearchIndicesClientCompat7to6(es_client)

        with mock.patch(
            "elasticsearch.Elasticsearch.info", wraps=es_client.info
        ) as mock_es_info:
            with mock.patch("richie.apps.search.ES_CLIENT", es_client):
                with mock.patch(
                    "richie.apps.search.ES_INDICES_CLIENT", es_indices_client
                ):
                    # Perform a bunch of ES actions, from index management all the way to searches

                    es_indices_client.delete(index="_all")
                    es_indices_client.create(index="test_categories")
                    es_indices_client.close(index="test_categories")
                    es_indices_client.put_settings(
                        body=ANALYSIS_SETTINGS, index="test_categories"
                    )
                    es_indices_client.open(index="test_categories")
                    es_indices_client.put_mapping(
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
                    bulk_compat(actions=actions, chunk_size=500, client=es_client)
                    es_indices_client.refresh()

                    self.client.get("/api/v1.0/subjets/")
                    self.client.get("/api/v1.0/levels/")
                    self.client.get("/api/v1.0/subjets/8312")

                    mock_es_info.assert_called_once()
                    mock_es_info.reset_mock()

                    # - Autocomplete checks the es_version,
                    #   info() should not be triggered again
                    self.client.get("/api/v1.0/subjects/autocomplete/?query=Lit")
                    self.client.get("/api/v1.0/levels/autocomplete/?query=Expert")
                    self.client.get("/api/v1.0/subjects/autocomplete/?query=Sci")
                    self.client.get("/api/v1.0/levels/autocomplete/?query=Bég")

                    mock_es_info.assert_not_called()
