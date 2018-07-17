"""
API endpoints to access subjects through ElasticSearch
"""
from django.conf import settings
from django.utils.module_loading import import_string
from django.utils.translation import get_language_from_request

from elasticsearch.exceptions import NotFoundError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from ..exceptions import QueryFormatException


class SubjectsViewSet(ViewSet):
    """
    A simple viewset with GET endpoints to fetch subjects
    See API Blueprint for details on consumer use.
    """

    # Get the subjects indexer from the settings
    indexer = import_string(settings.ES_INDICES.subjects)

    # pylint: disable=no-self-use,unused-argument
    def list(self, request, version):
        """
        Subject search endpoint: pass query params to ElasticSearch so it filters subjects
        and returns a list of matching items
        """
        try:
            limit, offset, query = self.indexer.build_es_query(request)
        except QueryFormatException as exc:
            # Return a 400 with error information if the query params are not as expected
            return Response(status=400, data={"errors": exc.args[0]})

        query_response = settings.ES_CLIENT.search(
            index=self.indexer.index_name,
            doc_type=self.indexer.document_type,
            body=query,
            # Directly pass meta-params through as arguments to the ES client
            from_=offset,
            size=limit or settings.ES_DEFAULT_PAGE_SIZE,
        )

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
                self.indexer.format_es_subject_for_api(
                    subject,
                    # Get the best language we can return multilingual fields in
                    get_language_from_request(request),
                )
                for subject in query_response["hits"]["hits"]
            ],
        }

        return Response(response_object)

    # pylint: disable=no-self-use,invalid-name,unused-argument
    def retrieve(self, request, pk, version):
        """
        Return a single item by ID
        """
        # Wrap the ES get in a try/catch to we control the exception we emit — it would
        # raise and end up in a 500 error otherwise
        try:
            query_response = settings.ES_CLIENT.get(
                index=self.indexer.index_name,
                doc_type=self.indexer.document_type,
                id=pk,
            )
        except NotFoundError:
            return Response(status=404)

        # Format a clean subject object as a response
        return Response(
            self.indexer.format_es_subject_for_api(
                query_response,
                # Get the best language we can return multilingual fields in
                get_language_from_request(request),
            )
        )
