
from elasticsearch import Elasticsearch

from ..utils import get_config


ES_CLIENT = Elasticsearch([get_config('ES_CLIENT', default='localhost')])

ES_CHUNK_SIZE = 500

ES_INDEX = 'fun_cms_courses'

ES_COURSE_TYPE = 'course'

ES_MAPPING = {
    'properties': {'key': {'type': 'keyword'}}}

