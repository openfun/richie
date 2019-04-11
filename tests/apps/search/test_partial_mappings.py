"""
Test for our partial mappings
"""
from django.test import TestCase

from elasticsearch.client import IndicesClient

from richie.apps.search import ES_CLIENT
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS, MULTILINGUAL_TEXT


class PartialMappingsTestCase(TestCase):
    """
    Make sure our mappings (esp. dynamic templates) are correctly understood by ElasticSearch
    """

    def setUp(self):
        """
        Instantiate our ES client and make sure all indexes are deleted before each test
        """
        super().setUp()
        self.indices_client = IndicesClient(client=ES_CLIENT)
        self.indices_client.delete(index="_all")

    def test_partial_mappings_multilingual_text(self):
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
        # The index needs to be closed before we set an analyzer
        self.indices_client.close(index=index_name)
        self.indices_client.put_settings(body=ANALYSIS_SETTINGS, index=index_name)
        self.indices_client.open(index=index_name)

        # The stub mapping only contains our dynamic template
        mapping = self.indices_client.get_mapping(
            index=index_name, doc_type=document_type
        )
        self.assertEqual(
            mapping[index_name]["mappings"][document_type],
            {"dynamic_templates": MULTILINGUAL_TEXT},
        )

        # Index an object that should trigger a match for our dynamic template
        ES_CLIENT.index(
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
                        "properties": {
                            "fr": {
                                "type": "text",
                                "fields": {
                                    "language": {"type": "text", "analyzer": "french"},
                                    "trigram": {
                                        "type": "text",
                                        "analyzer": "french_trigram",
                                        "search_analyzer": "french",
                                    },
                                },
                            }
                        }
                    }
                },
            },
        )

        # Index an object that should trigger a different match for our dynamic template
        ES_CLIENT.index(
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
                            "en": {
                                "type": "text",
                                "fields": {
                                    "language": {"type": "text", "analyzer": "english"},
                                    "trigram": {
                                        "type": "text",
                                        "analyzer": "english_trigram",
                                        "search_analyzer": "english",
                                    },
                                },
                            },
                            "fr": {
                                "type": "text",
                                "fields": {
                                    "language": {"type": "text", "analyzer": "french"},
                                    "trigram": {
                                        "type": "text",
                                        "analyzer": "french_trigram",
                                        "search_analyzer": "french",
                                    },
                                },
                            },
                        }
                    }
                },
            },
        )
