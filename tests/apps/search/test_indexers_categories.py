"""
Tests for the category indexer
"""
from unittest import mock

from django.test import TestCase

from cms.api import add_plugin
from djangocms_picture.models import Picture

from richie.apps.courses.factories import CategoryFactory
from richie.apps.search.indexers.categories import CategoriesIndexer


class CategoriesIndexersTestCase(TestCase):
    """
    Test the get_es_documents() function on the category indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @mock.patch.object(
        Picture, "img_src", new_callable=mock.PropertyMock, return_value="123.jpg"
    )
    def test_indexers_categories_get_es_documents(self, _mock_picture):
        """
        Happy path: the data is fetched from the models properly formatted
        """
        category1 = CategoryFactory(
            page_title={"en": "my first category", "fr": "ma première thématique"},
            fill_logo=True,
            should_publish=True,
        )
        CategoryFactory(
            page_parent=category1.extended_object,
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
                CategoriesIndexer.get_es_documents(
                    index="some_index", action="some_action"
                )
            ),
            [
                {
                    "_id": "L-00010001",
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "category",
                    "absolute_url": {
                        "en": "/en/my-first-category/my-second-category/",
                        "fr": "/fr/ma-premiere-thematique/ma-deuxieme-thematique/",
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
                    "is_meta": False,
                    "logo": {},
                    "nb_children": 0,
                    "path": "00010001",
                    "title": {
                        "en": "my second category",
                        "fr": "ma deuxième thématique",
                    },
                },
                {
                    "_id": "P-0001",
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
                    "is_meta": True,
                    "logo": {"en": "123.jpg", "fr": "123.jpg"},
                    "nb_children": 1,
                    "path": "0001",
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
                "is_meta": True,
                "logo": {"en": "/image_en.png", "fr": "/image_fr.png"},
                "nb_children": 3,
                "path": "00010001",
                "title": {"en": "Computer science", "fr": "Informatique"},
            },
        }
        self.assertEqual(
            CategoriesIndexer.format_es_object_for_api(es_category, "en"),
            {
                "id": 89,
                "is_meta": True,
                "logo": "/image_en.png",
                "nb_children": 3,
                "path": "00010001",
                "title": "Computer science",
            },
        )
