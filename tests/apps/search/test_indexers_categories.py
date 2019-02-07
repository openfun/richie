"""
Tests for the category indexer
"""
from types import SimpleNamespace
from unittest import mock

from django.test import TestCase

from cms.api import add_plugin
from djangocms_picture.models import Picture

from richie.apps.courses.factories import CategoryFactory
from richie.apps.search.exceptions import QueryFormatException
from richie.apps.search.indexers.categories import CategoriesIndexer


class CategoriesIndexersTestCase(TestCase):
    """
    Test the get_data_for_es() function on the category indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @mock.patch.object(
        Picture, "img_src", new_callable=mock.PropertyMock, return_value="123.jpg"
    )
    def test_indexers_categories_get_data_for_es(self, _mock_picture):
        """
        Happy path: the data is fetched from the models properly formatted
        """
        category1 = CategoryFactory(
            page_title={"en": "my first category", "fr": "ma première thématique"},
            fill_logo=True,
            should_publish=True,
        )
        category2 = CategoryFactory(
            page_title={"en": "my second category", "fr": "ma deuxième thématique"},
            should_publish=True,
        )

        # Add a description in several languages to the first category
        placeholder = category1.public_extension.extended_object.placeholders.get(
            slot="description"
        )
        plugin_params = {"placeholder": placeholder, "plugin_type": "CKEditorPlugin"}
        add_plugin(body="english description line 1.", language="en", **plugin_params)
        add_plugin(body="english description line 2.", language="en", **plugin_params)
        add_plugin(body="description français ligne 1.", language="fr", **plugin_params)
        add_plugin(body="description français ligne 2.", language="fr", **plugin_params)

        # The results were properly formatted and passed to the consumer
        self.assertEqual(
            list(
                CategoriesIndexer.get_data_for_es(
                    index="some_index", action="some_action"
                )
            ),
            [
                {
                    "_id": str(category2.public_extension.extended_object_id),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "category",
                    "absolute_url": {
                        "en": "/en/my-second-category/",
                        "fr": "/fr/ma-deuxieme-thematique/",
                    },
                    "complete": {
                        "en": ["my second category", "second category", "category"],
                        "fr": [
                            "ma deuxième thématique",
                            "deuxième thématique",
                            "thématique",
                        ],
                    },
                    "description": {},
                    "logo": {},
                    "title": {
                        "en": "my second category",
                        "fr": "ma deuxième thématique",
                    },
                },
                {
                    "_id": str(category1.public_extension.extended_object_id),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "category",
                    "absolute_url": {
                        "en": "/en/my-first-category/",
                        "fr": "/fr/ma-premiere-thematique/",
                    },
                    "complete": {
                        "en": ["my first category", "first category", "category"],
                        "fr": [
                            "ma première thématique",
                            "première thématique",
                            "thématique",
                        ],
                    },
                    "description": {
                        "en": "english description line 1. english description line 2.",
                        "fr": "description français ligne 1. description français ligne 2.",
                    },
                    "logo": {"en": "123.jpg", "fr": "123.jpg"},
                    "title": {
                        "en": "my first category",
                        "fr": "ma première thématique",
                    },
                },
            ],
        )

    def test_indexers_categories_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted category
        """
        es_category = {
            "_id": 89,
            "_source": {
                "logo": {"en": "/image_en.png", "fr": "/image_fr.png"},
                "title": {"en": "Computer science", "fr": "Informatique"},
            },
        }
        self.assertEqual(
            CategoriesIndexer.format_es_object_for_api(es_category, "en"),
            {"id": 89, "logo": "/image_en.png", "title": "Computer science"},
        )

    def test_indexers_categories_build_es_query_search_all_categories(self):
        """
        Happy path: the expected ES query object is returned
        """
        request = SimpleNamespace(query_params={"limit": 13, "offset": 1})
        self.assertEqual(
            CategoriesIndexer.build_es_query(request),
            (13, 1, {"query": {"match_all": {}}}),
        )

    def test_indexers_categories_build_es_query_search_by_name(self):
        """
        Happy path: the expected ES query object is returned
        """
        self.assertEqual(
            CategoriesIndexer.build_es_query(
                SimpleNamespace(
                    query_params={"limit": 12, "offset": 4, "query": "user search"}
                )
            ),
            (
                12,
                4,
                {
                    "query": {
                        "match": {
                            "title.fr": {"query": "user search", "analyzer": "french"}
                        }
                    }
                },
            ),
        )

    def test_indexers_categories_build_es_query_with_invalid_params(self):
        """
        Error case: the request contained invalid parameters
        """
        with self.assertRaises(QueryFormatException):
            CategoriesIndexer.build_es_query(
                SimpleNamespace(query_params={"offset": "invalid input"})
            )
