"""
ElasticSearch settings mixin
"""

from configurations import values
from elasticsearch import Elasticsearch


class ElasticSearchMixin(object):
    """
    Elastic Search configuration mixin

    You may want to override default configuration by setting the following environment
    variable:

    * ES_CLIENT
    """

    ES_CLIENT = Elasticsearch([
        values.Value('localhost', environ_name='ES_CLIENT', environ_prefix=None),
    ])
    ES_CHUNK_SIZE = 500
    ES_INDEXES = [
        'apps.organizations.index.OrganizationIndexer',
    ]
