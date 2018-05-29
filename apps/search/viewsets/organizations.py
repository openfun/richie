"""
API endpoints to access organizations through ElasticSearch
"""
from django.conf import settings
from django.utils.translation import get_language_from_request
from elasticsearch.exceptions import NotFoundError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from ..forms import OrganizationListForm
from ..indexers.organizations import OrganizationsIndexer


class OrganizationsViewSet(ViewSet):
    """
    A simple viewset with GET endpoints to fetch organizations
    See API Blueprint for details on consumer use.
    """

    # pylint: disable=no-self-use,unused-argument
    def list(self, request, version):
        """
        Organization search endpoint: pass query params to ElasticSearch so it filters
        organizations and returns a list of matching items
        """
        # Instantiate a form with our query_params to check & sanitize them
        query_params_form = OrganizationListForm(request.query_params)

        # Return a 400 with error information if the query params are not as expected
        if not query_params_form.is_valid():
            return Response(status=400, data={"errors": query_params_form.errors})

        # Build a query that matches on the organization name field if it was passed by the client
        # Note: test_elasticsearch_feature.py needs to be updated whenever the search call
        # is updated and makes use new features.
        if query_params_form.cleaned_data.get("query"):
            search_payload = {
                "query": {
                    "match": {
                        "name.fr": {
                            "query": query_params_form.cleaned_data.get("query"),
                            "analyzer": "french",
                        }
                    }
                }
            }
        # Build a match_all query by default
        else:
            search_payload = {"query": {"match_all": {}}}

        query_response = settings.ES_CLIENT.search(
            index=OrganizationsIndexer.index_name,
            doc_type=OrganizationsIndexer.document_type,
            body=search_payload,
            # Directly pass meta-params through as arguments to the ES client
            from_=query_params_form.cleaned_data.get("offset") or 0,
            size=query_params_form.cleaned_data.get("limit")
            or settings.ES_DEFAULT_PAGE_SIZE,
        )

        # Format the response in a consumer-friendly way
        # NB: if there are 0 hits the query_response is formatted the exact same way, only the
        # .hits.hits array is empty.
        response_object = {
            "meta": {
                "count": len(query_response["hits"]["hits"]),
                "offset": query_params_form.cleaned_data.get("offset") or 0,
                "total_count": query_response["hits"]["total"],
            },
            "objects": [
                OrganizationsIndexer.format_es_organization_for_api(
                    organization,
                    # Get the best language to return multilingual fields
                    get_language_from_request(request),
                )
                for organization in query_response["hits"]["hits"]
            ],
        }

        return Response(response_object)

    # pylint: disable=no-self-use,invalid-name,unused-argument
    def retrieve(self, request, pk, version):
        """
        Return a single organization by ID
        """
        # Wrap the ES get in a try/catch so we control the exception we emit — it would
        # raise and end up in a 500 error otherwise
        try:
            query_response = settings.ES_CLIENT.get(
                index=OrganizationsIndexer.index_name,
                doc_type=OrganizationsIndexer.document_type,
                id=pk,
            )
        except NotFoundError:
            return Response(status=404)

        # Format a clean organization object as a response
        return Response(
            OrganizationsIndexer.format_es_organization_for_api(
                query_response,
                # Get the best language we can return multilingual fields in
                get_language_from_request(request),
            )
        )
