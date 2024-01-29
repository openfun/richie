"""
Tests for the organization indexer
"""

from unittest import mock

from django.test import TestCase

from cms.api import add_plugin

from richie.apps.courses.factories import OrganizationFactory
from richie.apps.search.indexers.organizations import OrganizationsIndexer


class OrganizationsIndexersTestCase(TestCase):
    """
    Test the get_es_documents() function on the organization indexer, as well as our mapping,
    and especially dynamic mapping shape in ES
    """

    @mock.patch(
        "richie.apps.search.indexers.organizations.get_picture_info",
        return_value="logo info",
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
        organization2 = OrganizationFactory(
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
                    "_id": organization2.get_es_id(),
                    "_index": "some_index",
                    "_op_type": "some_action",
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
                    "title_raw": {
                        "en": "my second organization",
                        "fr": "ma deuxième organisation",
                    },
                },
                {
                    "_id": organization1.get_es_id(),
                    "_index": "some_index",
                    "_op_type": "some_action",
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
                    "logo": {"en": "logo info", "fr": "logo info"},
                    "title": {
                        "en": "my first organization",
                        "fr": "ma première organisation",
                    },
                    "title_raw": {
                        "en": "my first organization",
                        "fr": "ma première organisation",
                    },
                },
            ],
        )

    def test_indexers_organizations_get_es_documents_unpublished(self):
        """Unpublished organizations should not be indexed"""
        OrganizationFactory()

        # The unpublished organization should not get indexed
        self.assertEqual(
            list(
                OrganizationsIndexer.get_es_documents(
                    index="some_index", action="some_action"
                )
            ),
            [],
        )

    def test_indexers_organizations_get_es_documents_language_fallback(self):
        """Absolute urls should be computed as expected with language fallback."""
        OrganizationFactory(
            page_title={
                "fr": "ma première organisation",
            },
            should_publish=True,
        )
        indexed_organizations = list(
            OrganizationsIndexer.get_es_documents(
                index="some_index", action="some_action"
            )
        )

        self.assertEqual(
            indexed_organizations[0]["absolute_url"],
            {
                "en": "/en/ma-premiere-organisation/",
                "fr": "/fr/ma-premiere-organisation/",
            },
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

    def test_indexers_organizations_format_es_document_for_autocomplete(self):
        """
        Make sure format_es_document_for_autocomplete returns a properly
        formatted organization suggestion.
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
            OrganizationsIndexer.format_es_document_for_autocomplete(
                es_organization, "en"
            ),
            {"id": 217, "kind": "organizations", "title": "University of Paris XIII"},
        )
