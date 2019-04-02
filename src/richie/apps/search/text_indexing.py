"""
Customize text analysis & mapping to handle multilingual text and manage searches of word
fragments through n-grams.
"""

# Dynamic template to match translated strings with their language analyzer
# NB: expects objects to follow a conventional form, eg:
#   {
#       'title': {
#           'en': '<english title>',
#           'fr': '<french title>',
#       },
#   }
# Where all the language keys are optional and dynamically added to the mapping at indexing time
MULTILINGUAL_TEXT = [
    {
        "english_strings": {
            "match_mapping_type": "string",
            "path_match": "*.en",
            "mapping": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "english"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "english_trigram",
                        # If we apply trigram on the text query, searching "artificial" will
                        # match "artificial" but also "art" with a lesser score. This is fine
                        # when results are sorted by score but in our case, sorting is complex
                        # and grouped in buckets (open, ongoing, coming soon, archived,...). For
                        # the moment, we consider that using a standard analyzer on the text
                        # query is good enough.
                        "search_analyzer": "english",
                    },
                },
            },
        }
    },
    {
        "french_strings": {
            "match_mapping_type": "string",
            "path_match": "*.fr",
            "mapping": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        # See above note explaining why we don't want to apply trigram on the
                        # text query.
                        "search_analyzer": "french",
                    },
                },
            },
        }
    },
]


# Settings inspired from
# https://www.elastic.co/guide/en/elasticsearch/reference/master/analysis-lang-analyzer.html
ANALYSIS_SETTINGS = {
    "analysis": {
        "filter": {
            "french_elision": {
                "type": "elision",
                "articles_case": True,
                "articles": [
                    "l",
                    "m",
                    "t",
                    "qu",
                    "n",
                    "s",
                    "j",
                    "d",
                    "c",
                    "jusqu",
                    "quoiqu",
                    "lorsqu",
                    "puisqu",
                ],
            },
            "french_stop": {"type": "stop", "stopwords": "_french_"},
            "french_stemmer": {"type": "stemmer", "language": "french"},
            "english_stop": {"type": "stop", "stopwords": "_english_"},
            "english_stemmer": {"type": "stemmer", "language": "english"},
            "english_possessive_stemmer": {
                "type": "stemmer",
                "language": "possessive_english",
            },
        },
        "analyzer": {
            "english": {
                "type": "custom",
                "tokenizer": "standard",
                "filter": [
                    "english_possessive_stemmer",
                    "lowercase",
                    "english_stop",
                    "english_stemmer",
                    "asciifolding",
                ],
            },
            "english_trigram": {
                "type": "custom",
                "tokenizer": "trigram",
                "filter": [
                    "english_possessive_stemmer",
                    "lowercase",
                    "english_stop",
                    "english_stemmer",
                    "asciifolding",
                ],
            },
            "french": {
                "type": "custom",
                "tokenizer": "standard",
                "filter": [
                    "french_elision",
                    "lowercase",
                    "french_stop",
                    "french_stemmer",
                    "asciifolding",
                ],
            },
            "french_trigram": {
                "type": "custom",
                "tokenizer": "trigram",
                "filter": [
                    "french_elision",
                    "lowercase",
                    "french_stop",
                    "french_stemmer",
                    "asciifolding",
                ],
            },
        },
        "tokenizer": {
            "trigram": {
                "type": "ngram",
                "min_gram": 3,
                "max_gram": 20,
                "token_chars": ["letter", "digit"],
            }
        },
    }
}
