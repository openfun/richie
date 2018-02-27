"""
Indexing utility for the ElasticSearch-related regenerate_index command
"""
import math

from django.conf import settings
import requests

from ..partial_mappings import MULTILINGUAL_TEXT
from ..exceptions import IndexerDataException


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
        # Set initial request params. Use math.inf so the first request always fires
        offset = 0
        page_length = 50
        total_count = math.inf

        # Iterate over the API as long as there are results to get
        while total_count > offset:
            response = requests.get(
                settings.COURSE_API_ENDPOINT,
                params={'page': 1 + offset // page_length, 'rpp': page_length}
            )

            # Make sure we throw if we received an invalid status code so everything is stopped
            try:
                response.raise_for_status()
            except requests.HTTPError:
                raise IndexerDataException(
                    'HTTP Request for ES data failed with code {:n}'.format(response.status_code),
                )

            # Get the parsed JSON content from the request
            try:
                content = response.json()
            except requests.compat.json.decoder.JSONDecodeError:
                raise IndexerDataException('Invalid JSON received from remote API')

            try:
                # Set the params for the next request (or to exit the loop)
                total_count = content['count']

                # Iterate over the results to put each of them in our index
                for course in content['results']:
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

            # Prepare the offset for the next request
            offset = offset + page_length
