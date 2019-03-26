"""
Tests for the organization indexer
"""
from unittest import mock

from django.test import TestCase

from cms.api import add_plugin
from djangocms_picture.models import Picture

from richie.apps.courses.factories import OrganizationFactory
from richie.apps.search.indexers.organizations import OrganizationsIndexer


class OrganizationsIndexersTestCase(TestCase):
    """
    Test the get_es_documents() function on the organization indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @mock.patch.object(
        Picture, "img_src", new_callable=mock.PropertyMock, return_value="123.jpg"
    )
    def test_indexers_organizations_get_es_documents(self, _mock_picture):
        """
        Happy path: organization data is fetched from the models properly formatted
        """
        organization1 = OrganizationFactory(
            page_title={
                "en": "my first organization",
                "fr": "ma première organisation",
            },
            fill_logo=True,
            should_publish=True,
        )
        OrganizationFactory(
            page_title={
                "en": "my second organization",
                "fr": "ma deuxième organisation",
            },
            should_publish=True,
        )

        # Add a description in several languages to the first organization
        placeholder = organization1.public_extension.extended_object.placeholders.get(
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
                OrganizationsIndexer.get_es_documents(
                    index="some_index", action="some_action"
                )
            ),
            [
                {
                    "_id": "L-0002",
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "organization",
                    "absolute_url": {
                        "en": "/en/my-second-organization/",
                        "fr": "/fr/ma-deuxieme-organisation/",
                    },
                    "complete": {
                        "en": [
                            "my second organization",
                            "second organization",
                            "organization",
                        ],
                        "fr": [
                            "ma deuxième organisation",
                            "deuxième organisation",
                            "organisation",
                        ],
                    },
                    "description": {},
                    "logo": {},
                    "title": {
                        "en": "my second organization",
                        "fr": "ma deuxième organisation",
                    },
                },
                {
                    "_id": "L-0001",
                    "_index": "some_index",
                    "_op_type": "some_action",
                    "_type": "organization",
                    "absolute_url": {
                        "en": "/en/my-first-organization/",
                        "fr": "/fr/ma-premiere-organisation/",
                    },
                    "complete": {
                        "en": [
                            "my first organization",
                            "first organization",
                            "organization",
                        ],
                        "fr": [
                            "ma première organisation",
                            "première organisation",
                            "organisation",
                        ],
                    },
                    "description": {
                        "en": "english description line 1. english description line 2.",
                        "fr": "description français ligne 1. description français ligne 2.",
                    },
                    "logo": {"en": "123.jpg", "fr": "123.jpg"},
                    "title": {
                        "en": "my first organization",
                        "fr": "ma première organisation",
                    },
                },
            ],
        )

    def test_indexers_organizations_format_es_object_for_api(self):
        """
        Make sure format_es_object_for_api returns a properly formatted organization
        """
        es_organization = {
            "_id": 217,
            "_source": {
                "logo": {"en": "/my_logo.png", "fr": "/mon_logo.png"},
                "title": {
                    "en": "University of Paris XIII",
                    "fr": "Université Paris 13",
                },
            },
        }
        self.assertEqual(
            OrganizationsIndexer.format_es_object_for_api(es_organization, "en"),
            {"id": 217, "logo": "/my_logo.png", "title": "University of Paris XIII"},
        )
