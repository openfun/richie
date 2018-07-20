"""
API endpoints to access courses through ElasticSearch
"""
from django.conf import settings
from django.utils.module_loading import import_string
from django.utils.translation import get_language_from_request

from elasticsearch.exceptions import NotFoundError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from ..exceptions import QueryFormatException


class CoursesViewSet(ViewSet):
    """
    A simple viewset with GET endpoints to fetch courses
    See API Blueprint for details on consumer use
    """

    # Get the courses indexer from the settings
    indexer = import_string(settings.ES_INDICES.courses)

    # pylint: disable=no-self-use,unused-argument,too-many-locals
    def list(self, request, version):
        """
        Course search endpoint: build an ElasticSearch request from our query params so
        it searches its index and returns a list of matching courses
        """

        # Define our aggregations names, for our ES query, which will match with the field
        # names on the objects & the facets we return on the API response
        facets = ["organizations", "subjects"]

        try:
            limit, offset, query, aggs = self.indexer.build_es_query(request, facets)
        except QueryFormatException as exc:
            # Return a 400 with error information if the query params are not as expected
            return Response(status=400, data={"errors": exc.args[0]})

        course_query_response = settings.ES_CLIENT.search(
            index=self.indexer.index_name,
            doc_type=self.indexer.document_type,
            body={"aggs": aggs, "query": query},
            # Directly pass meta-params through as arguments to the ES client
            from_=offset,
            size=limit or settings.ES_DEFAULT_PAGE_SIZE,
        )

        response_object = {
            "meta": {
                "count": len(course_query_response["hits"]["hits"]),
                "offset": offset,
                "total_count": course_query_response["hits"]["total"],
            },
            "objects": [
                self.indexer.format_es_course_for_api(
                    es_course,
                    # Get the best language we can return multilingual fields in
                    get_language_from_request(request),
                )
                for es_course in course_query_response["hits"]["hits"]
            ],
            # Transform facets (terms aggregations) into an easier-to-consume form: drop the meta
            # data and return objects with terms as keys and counts as values
            "facets": {
                field: {
                    term_value["key"]: term_value["doc_count"]
                    for term_value in value[field]["buckets"]
                }
                for field, value in course_query_response["aggregations"][
                    "all_courses"
                ].items()
                if field in facets
            },
        }

        # Will be formatting a response_object for consumption
        return Response(response_object)

    # pylint: disable=no-self-use,invalid-name,unused-argument
    def retrieve(self, request, pk, version):
        """
        Return a single course by ID
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

        # Format a clean course object as a response
        return Response(
            self.indexer.format_es_course_for_api(
                query_response,
                # Get the best language we can return multilingual fields in
                get_language_from_request(request),
            )
        )
