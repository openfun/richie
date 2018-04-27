"""
Centralize our custom ES mappings for easier reuse and testability
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
            "mapping": {"type": "text", "analyzer": "english"},
        }
    },
    {
        "french_strings": {
            "match_mapping_type": "string",
            "path_match": "*.fr",
            "mapping": {"type": "text", "analyzer": "french"},
        }
    },
]
