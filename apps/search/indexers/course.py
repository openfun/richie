"""
Indexing utility for the ElasticSearch-related regenerate_index command
"""
from django.conf import settings

from ..exceptions import IndexerDataException
from ..partial_mappings import MULTILINGUAL_TEXT
from ..utils.api_consumption import walk_api_json_list


class CourseIndexer():
    """
    Makes available the parameters the indexer requires as well as a function to shape
    objects into what we want to index in ElasticSearch
    """
    document_type = 'course'
    index_name = 'fun_cms_courses'
    mapping = {
        'dynamic_templates': MULTILINGUAL_TEXT,
        'properties': {
            'end_date': {'type': 'date'},
            'enrollment_end_date': {'type': 'date'},
            'enrollment_start_date': {'type': 'date'},
            'language': {'type': 'keyword'},
            'organizations': {'type': 'keyword'},
            'session_number': {'type': 'integer'},
            'start_date': {'type': 'date'},
            'subjects': {'type': 'keyword'},
            'thumbnails': {
                'properties': {
                    'about': {'type': 'text', 'index': False},
                    'big': {'type': 'text', 'index': False},
                    'facebook': {'type': 'text', 'index': False},
                    'small': {'type': 'text', 'index': False},
                },
                'type': 'object',
            },
        },
    }

    def get_data_for_es(self, index, action):
        """
        Load all the courses from the API and format them for the ElasticSearch index
        """
        content_pages = walk_api_json_list(settings.COURSE_API_ENDPOINT)

        for content_page in content_pages:
            try:
                for course in content_page['results']:
                    yield {
                        '_id': course['id'],
                        '_index': index,
                        '_op_type': action,
                        '_type': self.document_type,
                        'end_date': course['end_date'],
                        'enrollment_end_date': course['enrollment_end_date'],
                        'enrollment_start_date': course['enrollment_start_date'],
                        'language': course['language'],
                        'organizations': [org['id'] for org in course['universities']],
                        'session_number': course['session_number'],
                        'short_description': {course['language']: course['short_description']},
                        'start_date': course['start_date'],
                        'subjects': [subject['id'] for subject in course['subjects']],
                        'thumbnails': course['thumbnails'],
                        'title': {course['language']: course['title']},
                    }
            except KeyError:
                raise IndexerDataException('Unexpected data shape in courses to index')
