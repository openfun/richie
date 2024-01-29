"""
Tests for the licence indexer
"""

from django.test import TestCase

from parler.utils.context import switch_language

from richie.apps.courses.factories import LicenceFactory
from richie.apps.search.indexers.licences import LicencesIndexer


class LicencesIndexersTestCase(TestCase):
    """
    Test the get_es_documents() function on the licence indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    def test_indexers_licences_get_es_documents(self):
        """
        Happy path: licence data is fetched from the models properly formatted
        """
        licence1 = LicenceFactory(name="my first licence")
        with switch_language(licence1, "fr"):
            licence1.name = "ma première licence"
            licence1.content = "première licence contenu"
            licence1.save()

        licence2 = LicenceFactory(name="my second licence")
        with switch_language(licence2, "fr"):
            licence2.name = "ma deuxième licence"
            licence2.content = "deuxième licence contenu"
            licence2.save()

        # The results were properly formatted and passed to the consumer
        self.assertEqual(
            list(
                LicencesIndexer.get_es_documents(
                    index="some_index", action="some_action"
                )
            ),
            [
                {
                    "_id": licence1.id,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "complete": {
                        "en": [
                            "my first licence",
                            "first licence",
                            "licence",
                        ],
                        "fr": [
                            "ma première licence",
                            "première licence",
                            "licence",
                        ],
                    },
                    "content": {
                        "en": licence1.content,
                        "fr": "première licence contenu",
                    },
                    "title": {
                        "en": "my first licence",
                        "fr": "ma première licence",
                    },
                    "title_raw": {
                        "en": "my first licence",
                        "fr": "ma première licence",
                    },
                },
                {
                    "_id": licence2.id,
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "complete": {
                        "en": [
                            "my second licence",
                            "second licence",
                            "licence",
                        ],
                        "fr": [
                            "ma deuxième licence",
                            "deuxième licence",
                            "licence",
                        ],
                    },
                    "content": {
                        "en": licence2.content,
                        "fr": "deuxième licence contenu",
                    },
                    "title": {
                        "en": "my second licence",
                        "fr": "ma deuxième licence",
                    },
                    "title_raw": {
                        "en": "my second licence",
                        "fr": "ma deuxième licence",
                    },
                },
            ],
        )

    def test_indexers_licences_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted licence
        """
        es_licence = {
            "_id": 217,
            "_source": {
                "title": {
                    "en": "my licence title",
                    "fr": "titre de ma licence",
                },
            },
        }
        self.assertEqual(
            LicencesIndexer.format_es_object_for_api(es_licence, "en"),
            {"id": 217, "title": "my licence title"},
        )

    def test_indexers_licences_format_es_document_for_autocomplete(self):
        """
        Make sure format_es_document_for_autocomplete returns a properly
        formatted licence suggestion.
        """
        es_licence = {
            "_id": 217,
            "_source": {
                "title": {
                    "en": "my licence title",
                    "fr": "titre de ma licence",
                },
            },
        }
        self.assertEqual(
            LicencesIndexer.format_es_document_for_autocomplete(es_licence, "fr"),
            {"id": 217, "kind": "licences", "title": "titre de ma licence"},
        )
