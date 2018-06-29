"""
Test for our partial mappings
"""
from django.conf import settings
from django.test import TestCase

from elasticsearch.client import IndicesClient

from ..partial_mappings import MULTILINGUAL_TEXT


class PartialMappingsTestCase(TestCase):
    """
    Make sure our mappings (esp. dynamic templates) are correctly understood by ElasticSearch
    """

    def setUp(self):
        """
        Instantiate our ES client and make sure all indexes are deleted before each test
        """
        super().setUp()
        self.indices_client = IndicesClient(client=settings.ES_CLIENT)
        self.indices_client.delete(index="_all")

    def test_multilingual_text(self):
        """
        Make sure our multilingual_text dynamic mapping results in the proper mappings being
        generated when objects with the expected format are indexed
        """
        document_type = "stub"
        index_name = "stub_index"
        mapping = {"dynamic_templates": MULTILINGUAL_TEXT}

        # Create the index and set a mapping that includes the pattern we want to test
        self.indices_client.create(index=index_name)
        self.indices_client.put_mapping(
            index=index_name, doc_type=document_type, body=mapping
        )

        # The stub mapping only contains our dynamic template
        mapping = self.indices_client.get_mapping(
            index=index_name, doc_type=document_type
        )
        self.assertEqual(
            mapping[index_name]["mappings"][document_type],
            {"dynamic_templates": MULTILINGUAL_TEXT},
        )

        # Index an object that should trigger a match for our dynamic template
        settings.ES_CLIENT.index(
            index=index_name,
            doc_type=document_type,
            body={"title": {"fr": "Un titre en français à titre d'exemple"}},
        )

        # The stub mapping has been extended with a matching property for 'fr'
        mapping = self.indices_client.get_mapping(
            index=index_name, doc_type=document_type
        )
        self.assertEqual(
            mapping[index_name]["mappings"][document_type],
            {
                "dynamic_templates": MULTILINGUAL_TEXT,
                "properties": {
                    "title": {
                        "properties": {"fr": {"type": "text", "analyzer": "french"}}
                    }
                },
            },
        )

        # Index an object that should trigger a different match for our dynamic template
        settings.ES_CLIENT.index(
            index=index_name,
            doc_type=document_type,
            body={"title": {"en": "An English title as an example"}},
        )

        # The sub mapping has been extended with a matching property for 'en'
        mapping = self.indices_client.get_mapping(
            index=index_name, doc_type=document_type
        )
        self.assertEqual(
            mapping[index_name]["mappings"][document_type],
            {
                "dynamic_templates": MULTILINGUAL_TEXT,
                "properties": {
                    "title": {
                        "properties": {
                            "en": {"type": "text", "analyzer": "english"},
                            "fr": {"type": "text", "analyzer": "french"},
                        }
                    }
                },
            },
        )
