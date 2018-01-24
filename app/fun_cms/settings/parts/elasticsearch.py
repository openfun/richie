
from elasticsearch import Elasticsearch

from ..utils import get_config


ES_CLIENT = Elasticsearch([get_config('ES_CLIENT', default='localhost')])

