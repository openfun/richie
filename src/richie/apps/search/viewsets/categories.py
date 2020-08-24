"""
API endpoints to access categories through ElasticSearch
"""
from django.conf import settings
from django.utils.translation import get_language_from_request

from elasticsearch.exceptions import NotFoundError
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .. import ES_CLIENT
from ..defaults import ES_PAGE_SIZE
from ..indexers import ES_INDICES
from ..utils.viewsets import ViewSetMetadata


class CategoriesViewSet(ViewSet):
    """
    A simple viewset with GET endpoints to fetch categories
    See API Blueprint for details on consumer use.
    """

    _meta = ViewSetMetadata(indexer=ES_INDICES.categories)

    # pylint: disable=no-self-use,unused-argument
    def list(self, request, version, kind):
        """
        Category search endpoint: pass query params to ElasticSearch so it filters categories
        and returns a list of matching items
        """
        # Instantiate the form to allow validation/cleaning
        params_form = self._meta.indexer.form(data=request.query_params)

        # Return a 400 with error information if the query params are not valid
        if not params_form.is_valid():
            return Response(status=400, data={"errors": params_form.errors})

        limit, offset, query = params_form.build_es_query(kind=kind)

        try:
            # pylint: disable=unexpected-keyword-arg
            query_response = ES_CLIENT.search(
                _source=getattr(self._meta.indexer, "display_fields", "*"),
                index=self._meta.indexer.index_name,
                doc_type=self._meta.indexer.document_type,
                body=query,
                # Directly pass meta-params through as arguments to the ES client
                from_=offset,
                size=limit or getattr(settings, "RICHIE_ES_PAGE_SIZE", ES_PAGE_SIZE),
            )
        except NotFoundError as error:
            raise NotFound from error

        # Format the response in a consumer-friendly way
        # NB: if there are 0 hits the query_response is formatted the exact same way, only the
        # .hits.hits array is empty.
        response_object = {
            "meta": {
                "count": len(query_response["hits"]["hits"]),
                "offset": offset,
                "total_count": query_response["hits"]["total"],
            },
            "objects": [
                self._meta.indexer.format_es_object_for_api(
                    category,
                    # Get the best language we can return multilingual fields in
                    get_language_from_request(request),
                )
                for category in query_response["hits"]["hits"]
            ],
        }

        return Response(response_object)

    # pylint: disable=no-self-use,invalid-name,unused-argument
    def retrieve(self, request, pk, version, kind):
        """
        Return a single item by ID
        """
        # Wrap the ES get in a try/catch to we control the exception we emit — it would
        # raise and end up in a 500 error otherwise
        try:
            query_response = ES_CLIENT.get(
                index=self._meta.indexer.index_name,
                doc_type=self._meta.indexer.document_type,
                id=pk,
            )
        except NotFoundError as error:
            raise NotFound from error

        # Format a clean category object as a response
        return Response(
            self._meta.indexer.format_es_object_for_api(
                query_response,
                # Get the best language we can return multilingual fields in
                get_language_from_request(request),
            )
        )

    @action(detail=False)
    def autocomplete(self, request, version, kind):
        """
        Use the "completion" field on the categories mapping & objects to provide autocomplete
        functionality through an API endpoint.
        We cannot reuse the `AutocompleteMixin` as it does not handle "kinds" as categories need.
        """
        # Get a hold of the relevant indexer
        indexer = self._meta.indexer

        # Query our specific ES completion field
        autocomplete_query_response = ES_CLIENT.search(
            index=indexer.index_name,
            doc_type=indexer.document_type,
            body={
                "suggest": {
                    "categories": {
                        "prefix": request.query_params["query"],
                        "completion": {
                            "contexts": {"kind": [kind]},
                            "field": "complete.{:s}".format(
                                get_language_from_request(request)
                            ),
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
                for option in autocomplete_query_response["suggest"]["categories"][0][
                    "options"
                ]
            ]
        )
