"""
Helpers to enable reuse for needs that are shared between viewsets.
"""
from django.utils.translation import get_language_from_request

from rest_framework.decorators import action
from rest_framework.response import Response

from .. import ES_CLIENT


class ViewSetMetadata:
    """
    "Meta" class intended to be used as an attribute on ViewSets to provide a common set of
    meta attributes, like the Django `class Meta` on eg. models.
    """

    def __init__(self, indexer):
        """
        Set the required attributes passed from the call site. Currently this only includes
        the ViewSet's corresponding indexer.
        """
        self.indexer = indexer


class AutocompleteMixin:
    """
    Add a `/{resource}/autocomplete` route on a ViewSet enabling clients to make autocompletion
    requests using the specific fields & queries in ElasticSearch, as defined in the relevant
    resource's indexer.
    """

    # pylint: disable=unused-argument
    @action(detail=False)
    def autocomplete(self, request, version):
        """
        Use the "completion" field on the organization mapping & objects to provide autocomplete
        functionality through an API endpoint.
        """
        # This mixin is intended to be used on ViewSets. It requires a _meta attribute holding
        # the relevant indexer
        indexer = self._meta.indexer

        # Query our specific ES completion field
        autocomplete_query_response = ES_CLIENT.search(
            index=indexer.index_name,
            doc_type=indexer.document_type,
            body={
                "suggest": {
                    "objects": {
                        "prefix": request.query_params["query"],
                        "completion": {
                            "field": "complete.{:s}".format(
                                get_language_from_request(request)
                            )
                        },
                    }
                }
            },
        )

        # Build a response array from the list of completion options
        return Response(
            [
                indexer.format_es_document_for_autocomplete(
                    option, get_language_from_request(request)
                )
                for option in autocomplete_query_response["suggest"]["objects"][0][
                    "options"
                ]
            ]
        )
