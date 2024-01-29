"""
Build an interoperability layer that allows Richie to work with ElasticSearch 6
just like it does with ElasticSearch 7.
"""

# pragma pylint: disable=W0221
from django.utils.functional import cached_property

from elasticsearch import Elasticsearch, Transport
from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

# Dummy type used to satisfy the ES6 requirement to have type. "_doc" is conventional,
# and the actual value of the string does not change anything functionally.
DOC_TYPE = "_doc"


class ElasticsearchClientCompat7to6(Elasticsearch):
    """
    Compatibility wrapper around the Elasticsearch client from elasticsearch-py that
    handles incompatibilities to let Richie run ES6 and ES7.
    """

    def __init__(self, hosts=None, transport_class=Transport, **kwargs):
        """
        Instantiate the actual Elasticsearch client, then use it to detect the version
        of Elasticsearch we're working with.
        """
        super().__init__(hosts=hosts, transport_class=transport_class, **kwargs)

    @cached_property
    def __es_version__(self):
        """
        First retrieve version from elasticsearch server then returns the cached result
        """
        return self.info()["version"]["number"][:1]

    # pylint: disable=W0622
    def get(self, index, id):
        """
        Patch the dummy doc type onto document retrieval requests so ES6 accepts the requests.
        """

        return super().get(index=index, id=id, doc_type=DOC_TYPE)

    def search(self, body=None, index=None, params=None, **kwargs):
        """
        Patch the "value" & "relation" dict in place of the int returned by ES6 for
        search query hits total count.
        """

        search_response = super().search(
            body=body, index=index, params=params or {}, **kwargs
        )

        if self.__es_version__ == "6":
            search_response["hits"]["total"] = {
                "value": search_response["hits"]["total"],
                "relation": "eq",
            }

        return search_response


class ElasticsearchIndicesClientCompat7to6(IndicesClient):
    """
    Compatibility wrapper around the ES IndicesClient from elasticsearch-py that
    handles incompatibilities to let Richie run ES6 and ES7.
    """

    def get_mapping(self, index=None, params=None):
        """
        Pluck from the dummy type in the mapping if using ES6, which nests the actual
        mapping info under the document type.
        """

        mappings = super().get_mapping(index=index, params=params or {})

        if self.client.__es_version__ == "6":
            for index_name in mappings.keys():
                mappings[index_name]["mappings"] = mappings[index_name]["mappings"][
                    DOC_TYPE
                ]

        return mappings

    def put_mapping(self, body, index=None, params=None):
        """
        Add our dummy type in kwargs of the put_mapping call to satisfy the requirement in ES.
        """

        if self.client.__es_version__ == "6":
            return super().put_mapping(
                body, doc_type=DOC_TYPE, index=index, params=params or {}
            )

        return super().put_mapping(body, index=index, params=params or {})


def bulk_compat_7_to_6(client, actions, *args, stats_only=False, **kwargs):
    """
    Patch a dummy type on all actions to satisfy the requirement for ES6. As types are not
    actually used for anything, we can use the same value everywhere.
    """
    if client.__es_version__ == "6":
        # Use a generator expression instead of a for loop to keep actions lazy
        actions = ({**action, "_type": DOC_TYPE} for action in actions)

    bulk(client, actions, stats_only=stats_only, *args, **kwargs)


bulk_compat = bulk_compat_7_to_6
