"""
Tests for the subject indexer
"""
from types import SimpleNamespace
from unittest import mock

from django.test import TestCase

from cms.api import add_plugin
from djangocms_picture.models import Picture

from richie.apps.courses.factories import SubjectFactory
from richie.apps.search.exceptions import QueryFormatException
from richie.apps.search.indexers.subjects import SubjectsIndexer


class SubjectsIndexersTestCase(TestCase):
    """
    Test the get_data_for_es() function on the subject indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @mock.patch.object(
        Picture, "img_src", new_callable=mock.PropertyMock, return_value="123.jpg"
    )
    def test_indexers_subjects_get_data_for_es(self, _mock_picture):
        """
        Happy path: the data is fetched from the models properly formatted
        """
        subject1 = SubjectFactory(
            page_title={"en": "my first subject", "fr": "ma première thématique"},
            fill_logo=True,
            should_publish=True,
        )
        subject2 = SubjectFactory(
            page_title={"en": "my second subject", "fr": "ma deuxième thématique"},
            should_publish=True,
        )

        # Add a description in several languages to the first subject
        placeholder = subject1.public_extension.extended_object.placeholders.get(
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
                SubjectsIndexer.get_data_for_es(
                    index="some_index", action="some_action"
                )
            ),
            [
                {
                    "_id": str(subject2.public_extension.pk),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "subject",
                    "absolute_url": {
                        "en": "/en/my-second-subject/",
                        "fr": "/fr/ma-deuxieme-thematique/",
                    },
                    "complete": {
                        "en": ["my second subject", "second subject", "subject"],
                        "fr": [
                            "ma deuxième thématique",
                            "deuxième thématique",
                            "thématique",
                        ],
                    },
                    "description": {},
                    "logo": {},
                    "title": {
                        "en": "my second subject",
                        "fr": "ma deuxième thématique",
                    },
                },
                {
                    "_id": str(subject1.public_extension.pk),
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "subject",
                    "absolute_url": {
                        "en": "/en/my-first-subject/",
                        "fr": "/fr/ma-premiere-thematique/",
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
                    "logo": {"en": "123.jpg", "fr": "123.jpg"},
                    "title": {"en": "my first subject", "fr": "ma première thématique"},
                },
            ],
        )

    def test_indexers_subjects_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted subject
        """
        es_subject = {
            "_id": 89,
            "_source": {
                "logo": {"en": "/image_en.png", "fr": "/image_fr.png"},
                "title": {"en": "Computer science", "fr": "Informatique"},
            },
        }
        self.assertEqual(
            SubjectsIndexer.format_es_object_for_api(es_subject, "en"),
            {"id": 89, "logo": "/image_en.png", "title": "Computer science"},
        )

    def test_indexers_subjects_build_es_query_search_all_subjects(self):
        """
        Happy path: the expected ES query object is returned
        """
        request = SimpleNamespace(query_params={"limit": 13, "offset": 1})
        self.assertEqual(
            SubjectsIndexer.build_es_query(request),
            (13, 1, {"query": {"match_all": {}}}),
        )

    def test_indexers_subjects_build_es_query_search_by_name(self):
        """
        Happy path: the expected ES query object is returned
        """
        self.assertEqual(
            SubjectsIndexer.build_es_query(
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

    def test_indexers_subjects_build_es_query_with_invalid_params(self):
        """
        Error case: the request contained invalid parameters
        """
        with self.assertRaises(QueryFormatException):
            SubjectsIndexer.build_es_query(
                SimpleNamespace(query_params={"offset": "invalid input"})
            )
