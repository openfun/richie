"""
Tests for the category indexer
"""

from unittest import mock

from django.test import TestCase

from cms.api import add_plugin

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.factories import CategoryFactory
from richie.apps.search.indexers.categories import CategoriesIndexer


class CategoriesIndexersTestCase(TestCase):
    """
    Test the get_es_documents() function on the category indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @mock.patch(
        "richie.apps.search.indexers.categories.get_picture_info",
        return_value="picture info",
    )
    def test_indexers_categories_get_es_documents(self, _mock_picture):
        """
        Happy path: the data is fetched from the models properly formatted
        """
        # Our meta category and its page
        meta = CategoryFactory(
            page_parent=create_i18n_page(
                {"en": "Categories", "fr": "Catégories"}, published=True
            ),
            page_reverse_id="subjects",
            page_title={"en": "Subjects", "fr": "Sujets"},
            fill_icon=True,
            fill_logo=True,
            should_publish=True,
        )
        category1 = CategoryFactory(
            page_parent=meta.extended_object,
            page_title={"en": "my first subject", "fr": "ma première thématique"},
            fill_icon=True,
            fill_logo=True,
            should_publish=True,
        )
        category2 = CategoryFactory(
            page_parent=category1.extended_object,
            page_title={"en": "my second subject", "fr": "ma deuxième thématic"},
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
                    "_id": category2.get_es_id(),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "absolute_url": {
                        "en": "/en/categories/subjects/my-first-subject/my-second-subject/",
                        "fr": "/fr/categories/sujets/ma-premiere-thematique/ma-deuxieme-thematic/",
                    },
                    "complete": {
                        "en": ["my second subject", "second subject", "subject"],
                        "fr": ["ma deuxième thématic", "deuxième thématic", "thématic"],
                    },
                    "description": {},
                    "icon": {},
                    "is_meta": False,
                    "kind": "subjects",
                    "logo": {},
                    "nb_children": 0,
                    "path": "0001000100010001",
                    "title": {"en": "my second subject", "fr": "ma deuxième thématic"},
                    "title_raw": {
                        "en": "my second subject",
                        "fr": "ma deuxième thématic",
                    },
                },
                {
                    "_id": category1.get_es_id(),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "absolute_url": {
                        "en": "/en/categories/subjects/my-first-subject/",
                        "fr": "/fr/categories/sujets/ma-premiere-thematique/",
                    },
                    "complete": {
                        "en": ["my first subject", "first subject", "subject"],
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
                    "icon": {"en": "picture info", "fr": "picture info"},
                    "is_meta": False,
                    "kind": "subjects",
                    "logo": {"en": "picture info", "fr": "picture info"},
                    "nb_children": 1,
                    "path": "000100010001",
                    "title": {"en": "my first subject", "fr": "ma première thématique"},
                    "title_raw": {
                        "en": "my first subject",
                        "fr": "ma première thématique",
                    },
                },
                {
                    "_id": meta.get_es_id(),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "absolute_url": {
                        "en": "/en/categories/subjects/",
                        "fr": "/fr/categories/sujets/",
                    },
                    "complete": {"en": ["Subjects"], "fr": ["Sujets"]},
                    "description": {},
                    "icon": {"en": "picture info", "fr": "picture info"},
                    "is_meta": True,
                    "kind": "meta",
                    "logo": {"en": "picture info", "fr": "picture info"},
                    "nb_children": 1,
                    "path": "00010001",
                    "title": {"en": "Subjects", "fr": "Sujets"},
                    "title_raw": {"en": "Subjects", "fr": "Sujets"},
                },
            ],
        )

    def test_indexers_categories_get_es_documents_unpublished(self):
        """
        Unpublished categories and children of unpublished categories should not be indexed
        """
        # Our meta category and its page
        meta = CategoryFactory(
            page_parent=create_i18n_page("Categories", published=True),
            page_reverse_id="subjects",
            page_title="Subjects",
            should_publish=True,
        )
        parent = CategoryFactory(page_parent=meta.extended_object, should_publish=True)
        CategoryFactory(
            page_parent=parent.extended_object,
            page_title="my second subject",
            should_publish=True,
        )

        # Unpublish the parent category
        self.assertTrue(parent.extended_object.unpublish("en"))

        # The unpublished parent category and its child should not get indexed
        self.assertEqual(
            list(
                CategoriesIndexer.get_es_documents(
                    index="some_index", action="some_action"
                )
            ),
            [
                {
                    "_id": meta.get_es_id(),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "absolute_url": {
                        "en": "/en/categories/subjects/",
                        "fr": "/fr/categories/subjects/",
                    },
                    "complete": {"en": ["Subjects"]},
                    "description": {},
                    "icon": {},
                    "is_meta": True,
                    "kind": "meta",
                    "logo": {},
                    "nb_children": 1,
                    "path": "00010001",
                    "title": {"en": "Subjects"},
                    "title_raw": {"en": "Subjects"},
                },
            ],
        )

    def test_indexers_categories_get_es_documents_language_fallback(self):
        """Absolute urls should be computed as expected with language fallback."""
        # Our meta category and its page
        meta = CategoryFactory(
            page_parent=create_i18n_page({"fr": "Catégories"}, published=True),
            page_reverse_id="subjects",
            page_title={"en": "Subjects", "fr": "Sujets"},
            fill_icon=True,
            fill_logo=True,
            should_publish=True,
        )
        category1 = CategoryFactory(
            page_parent=meta.extended_object,
            page_title={"fr": "ma première thématique"},
            fill_icon=True,
            fill_logo=True,
            should_publish=True,
        )
        CategoryFactory(
            page_parent=category1.extended_object,
            page_title={"fr": "ma deuxième thématic"},
            should_publish=True,
        )

        self.assertEqual(
            list(
                CategoriesIndexer.get_es_documents(
                    index="some_index", action="some_action"
                )
            )[0]["absolute_url"],
            {
                "en": "/en/categories/sujets/ma-premiere-thematique/ma-deuxieme-thematic/",
                "fr": "/fr/categories/sujets/ma-premiere-thematique/ma-deuxieme-thematic/",
            },
        )

    def test_indexers_categories_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted category.
        """
        es_category = {
            "_id": 89,
            "_source": {
                "icon": {"en": "/icon_en.png", "fr": "/icon_fr.png"},
                "is_meta": True,
                "logo": {"en": "/logo_en.png", "fr": "/logo_fr.png"},
                "nb_children": 3,
                "path": "00010001",
                "title": {"en": "Computer science", "fr": "Informatique"},
            },
        }
        self.assertEqual(
            CategoriesIndexer.format_es_object_for_api(es_category, "en"),
            {
                "icon": "/icon_en.png",
                "id": 89,
                "is_meta": True,
                "logo": "/logo_en.png",
                "nb_children": 3,
                "path": "00010001",
                "title": "Computer science",
            },
        )

    def test_indexers_categories_format_es_document_for_autocomplete(self):
        """
        Make sure format_es_document_for_autocomplete returns a properly
        formatted category suggestion.
        """
        es_category = {
            "_id": 89,
            "_source": {
                "is_meta": True,
                "logo": {"en": "/image_en.png", "fr": "/image_fr.png"},
                "kind": "subjects",
                "nb_children": 3,
                "path": "00010001",
                "title": {"en": "Computer science", "fr": "Informatique"},
            },
        }
        self.assertEqual(
            CategoriesIndexer.format_es_document_for_autocomplete(es_category, "en"),
            {"id": 89, "kind": "subjects", "title": "Computer science"},
        )
