"""
API endpoints to access licences through ElasticSearch
"""

from django.conf import settings
from django.utils.translation import get_language_from_request

from elasticsearch.exceptions import NotFoundError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .. import ES_CLIENT
from ..defaults import ES_PAGE_SIZE
from ..indexers import ES_INDICES
from ..utils.viewsets import AutocompleteMixin, ViewSetMetadata


class LicencesViewSet(AutocompleteMixin, ViewSet):
    """
    A simple viewset with GET endpoints to fetch licences
    """

    _meta = ViewSetMetadata(indexer=ES_INDICES.licences)

    # pylint: disable=no-self-use,unused-argument
    def list(self, request, version):
        """
        Licence search endpoint: pass query params to ElasticSearch so it filters
        licences and returns a list of matching items
        """
        # Instantiate the form to allow validation/cleaning
        params_form = self._meta.indexer.form(data=request.query_params)

        # Return a 400 with error information if the query params are not valid
        if not params_form.is_valid():
            return Response(status=400, data={"errors": params_form.errors})

        limit, offset, query = params_form.build_es_query()

        query["sort"] = [
            {f"title_raw.{get_language_from_request(request)}": {"order": "asc"}}
        ]

        # pylint: disable=unexpected-keyword-arg
        search_query_response = ES_CLIENT.search(
            _source=getattr(self._meta.indexer, "display_fields", "*"),
            index=self._meta.indexer.index_name,
            body=query,
            # Directly pass meta-params through as arguments to the ES client
            from_=offset,
            size=limit or getattr(settings, "RICHIE_ES_PAGE_SIZE", ES_PAGE_SIZE),
        )

        # Format the response in a consumer-friendly way
        # NB: if there are 0 hits the query response is formatted the exact same way, only the
        # .hits.hits array is empty.
        response_object = {
            "meta": {
                "count": len(search_query_response["hits"]["hits"]),
                "offset": offset,
                "total_count": search_query_response["hits"]["total"]["value"],
            },
            "objects": [
                self._meta.indexer.format_es_object_for_api(
                    licence,
                    # Get the best language to return multilingual fields
                    get_language_from_request(request),
                )
                for licence in search_query_response["hits"]["hits"]
            ],
        }
        return Response(response_object)

    # pylint: disable=no-self-use,invalid-name,unused-argument
    def retrieve(self, request, pk, version):
        """
        Return a single licence by ID
        """
        # Wrap the ES get in a try/catch so we control the exception we emit — it would
        # raise and end up in a 500 error otherwise
        try:
            query_response = ES_CLIENT.get(
                index=self._meta.indexer.index_name,
                id=pk,
            )
        except NotFoundError:
            return Response(status=404)

        # Format a clean licence object as a response
        return Response(
            self._meta.indexer.format_es_object_for_api(
                query_response,
                # Get the best language we can return multilingual fields in
                get_language_from_request(request),
            )
        )
