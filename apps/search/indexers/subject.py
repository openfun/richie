"""
Indexing utility for the ElasticSearch-related regenerate_index command
"""
from django.conf import settings

from ..partial_mappings import MULTILINGUAL_TEXT
from ..exceptions import IndexerDataException
from ..utils.api_consumption import walk_api_json_list


class SubjectIndexer():
    """
    Makes available the params the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """
    document_type = 'subject'
    index_name = 'fun_cms_subjects'
    mapping = {
        'dynamic_templates': MULTILINGUAL_TEXT,
        'properties': {
            'image': {'type': 'text', 'index': False},
        },
    }

    def get_data_for_es(self, index, action):
        """
        Load all the subjects from the API and format them for the ElasticSearch index
        """
        content_pages = walk_api_json_list(settings.SUBJECT_API_ENDPOINT)

        for content_page in content_pages:
            try:
                for subject in content_page['results']:
                    yield {
                        '_id': subject['id'],
                        '_index': index,
                        '_op_type': action,
                        '_type': self.document_type,
                        'image': subject['image'],
                        'name': {'fr': subject['name']},
                    }
            except KeyError:
                raise IndexerDataException('Unexpected data shape in subjects to index')
