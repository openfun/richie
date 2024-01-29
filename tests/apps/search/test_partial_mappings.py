"""
Test for our partial mappings
"""

from django.test import TestCase

from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS, MULTILINGUAL_TEXT


class PartialMappingsTestCase(TestCase):
    """
    Make sure our mappings (esp. dynamic templates) are correctly understood by ElasticSearch
    """

    def setUp(self):
        """
        Instantiate our ES client and make sure all indices are deleted before each test
        """
        super().setUp()
        ES_INDICES_CLIENT.delete(index="_all")

    def test_partial_mappings_multilingual_text(self):
        """
        Make sure our multilingual_text dynamic mapping results in the proper mappings being
        generated when objects with the expected format are indexed
        """
        index_name = "stub_index"
        mapping = {"dynamic_templates": MULTILINGUAL_TEXT}

        # Create the index and set a mapping that includes the pattern we want to test
        ES_INDICES_CLIENT.create(index=index_name)
        ES_INDICES_CLIENT.put_mapping(index=index_name, body=mapping)
        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=index_name)
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=index_name)
        ES_INDICES_CLIENT.open(index=index_name)
        # The stub mapping only contains our dynamic template
        mapping = ES_INDICES_CLIENT.get_mapping(index=index_name)
        self.assertEqual(
            mapping[index_name]["mappings"],
            {"dynamic_templates": MULTILINGUAL_TEXT},
        )

        # Index an object that should trigger a match for our dynamic template
        ES_CLIENT.index(
            index=index_name,
            doc_type="_doc",
            body={"title": {"fr": "Un titre en français à titre d'exemple"}},
        )

        # The stub mapping has been extended with a matching property for 'fr'
        mapping = ES_INDICES_CLIENT.get_mapping(index=index_name)
        self.assertEqual(
            mapping[index_name]["mappings"],
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
            doc_type="_doc",
            body={"title": {"en": "An English title as an example"}},
        )

        # The sub mapping has been extended with a matching property for 'en'
        mapping = ES_INDICES_CLIENT.get_mapping(index=index_name)
        self.assertEqual(
            mapping[index_name]["mappings"],
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

    def test_partial_mappings_french_diacritics(self):
        """
        Make sure words ending in "icité" are analyzed the same way whether or not there
        is an accent.
        """
        index_name = "stub_index"
        mapping = {"dynamic_templates": MULTILINGUAL_TEXT}

        # Create the index and set a mapping that includes the pattern we want to test
        ES_INDICES_CLIENT.create(index=index_name)
        ES_INDICES_CLIENT.put_mapping(index=index_name, body=mapping)
        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=index_name)
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=index_name)
        ES_INDICES_CLIENT.open(index=index_name)

        self.assertEqual(
            ES_INDICES_CLIENT.analyze(
                body='{"analyzer": "french", "text": "électricité"}', index=index_name
            )["tokens"][0]["token"],
            "electricit",
        )
        self.assertEqual(
            ES_INDICES_CLIENT.analyze(
                body='{"analyzer": "french", "text": "electricite"}', index=index_name
            )["tokens"][0]["token"],
            "electricit",
        )

    def test_partial_mappings_code(self):
        """Make sure our code analyzer works as expected."""
        index_name = "stub_index"

        # Create the index and set a mapping that includes the pattern we want to test
        ES_INDICES_CLIENT.create(index=index_name)
        # The index needs to be closed before we set an analyzer
        ES_INDICES_CLIENT.close(index=index_name)
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=index_name)
        ES_INDICES_CLIENT.open(index=index_name)

        self.assertEqual(
            [
                t["token"]
                for t in ES_INDICES_CLIENT.analyze(
                    body='{"analyzer": "code_trigram", "text": "003rst"}',
                    index=index_name,
                )["tokens"]
            ],
            [
                "003",
                "003r",
                "003rs",
                "003rst",
                "03r",
                "03rs",
                "03rst",
                "3rs",
                "3rst",
                "rst",
            ],
        )

        self.assertEqual(
            [
                t["token"]
                for t in ES_INDICES_CLIENT.analyze(
                    body='{"analyzer": "code", "text": "003rst"}', index=index_name
                )["tokens"]
            ],
            ["003rst"],
        )
