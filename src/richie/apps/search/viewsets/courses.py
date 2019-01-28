"""
API endpoints to access courses through ElasticSearch
"""
from functools import reduce

from django.conf import settings
from django.utils.module_loading import import_string
from django.utils.translation import get_language_from_request

from elasticsearch.exceptions import NotFoundError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from ..defaults import FILTERS_HARDCODED, RESOURCE_FACETS
from ..exceptions import QueryFormatException
from ..utils.viewsets import AutocompleteMixin, ViewSetMetadata


class CoursesViewSet(AutocompleteMixin, ViewSet):
    """
    A simple viewset with GET endpoints to fetch courses
    See API Blueprint for details on consumer use
    """

    # Get the courses indexer from the settings
    _meta = ViewSetMetadata(indexer=import_string(settings.ES_INDICES.courses))

    # pylint: disable=no-self-use,unused-argument,too-many-locals
    def list(self, request, version):
        """
        Course search endpoint: build an ElasticSearch request from our query params so
        it searches its index and returns a list of matching courses
        """

        try:
            limit, offset, query, aggs = self._meta.indexer.build_es_query(request)
        except QueryFormatException as exc:
            # Return a 400 with error information if the query params are not as expected
            return Response(status=400, data={"errors": exc.args[0]})

        course_query_response = settings.ES_CLIENT.search(
            _source=getattr(self._meta.indexer, "display_fields", "*"),
            index=self._meta.indexer.index_name,
            doc_type=self._meta.indexer.document_type,
            body={
                "aggs": aggs,
                "query": query,
                "sort": self._meta.indexer.get_list_sorting_script(),
            },
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
                self._meta.indexer.format_es_object_for_api(
                    es_course,
                    # Get the best language we can return multilingual fields in
                    get_language_from_request(request),
                )
                for es_course in course_query_response["hits"]["hits"]
            ],
            # Transform facets (terms aggregations) into an easier-to-consume form: drop the meta
            # data and return objects with terms as keys and counts as values
            "facets": {
                # Resource (terms) facets are structured in the same way
                **{
                    field: {
                        term_value["key"]: term_value["doc_count"]
                        for term_value in value[field]["buckets"]
                    }
                    for field, value in course_query_response["aggregations"][
                        "all_courses"
                    ].items()
                    # Remove default fields inserted by elasticsearch
                    if field in RESOURCE_FACETS
                },
                # Custom (filter-based) facets are structured in another, common way
                **reduce(
                    # kv_pair is a tuple with (key, value) for our aggregations, eg. an item in
                    # [ (language@en, { doc_count: 42 }), (language@fr, { doc_count: 84 }) ]
                    # we want to output something way easier to consume and less redundant:
                    # { language: { en: 42, fr: 84 } }
                    lambda agg, kv_pair: {
                        # spread the existing aggregator to keep the already set aggs
                        **agg,
                        # Add or extend the object for one filter (eg. language, availability)
                        **dict(
                            [
                                (
                                    # Use the filter name as a key (eg. language, availability)
                                    kv_pair[0][: kv_pair[0].find("@")],
                                    {
                                        # Keep the key/value pairs already on the aggregator
                                        **agg.get(
                                            kv_pair[0][: kv_pair[0].find("@")], {}
                                        ),
                                        # Add our incoming key/value pair (eg. en: 84)
                                        **dict(
                                            [
                                                (
                                                    # Use the filter value as a key (eg. fr, open)
                                                    kv_pair[0][
                                                        kv_pair[0].find("@")
                                                        + 1 :  # noqa: E203
                                                    ],
                                                    # The actual interesting value is the count
                                                    kv_pair[1]["doc_count"],
                                                )
                                            ]
                                        ),
                                    },
                                )
                            ]
                        ),
                    },
                    # Select only the aggregations coming from hardcoded filters
                    # kv_pair is a tuple with (key, value) for our aggregations (see above)
                    filter(
                        lambda kv_pair: kv_pair[0][: kv_pair[0].find("@")]
                        in FILTERS_HARDCODED,
                        course_query_response["aggregations"]["all_courses"].items(),
                    ),
                    {},
                ),
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
                index=self._meta.indexer.index_name,
                doc_type=self._meta.indexer.document_type,
                id=pk,
            )
        except NotFoundError:
            return Response(status=404)

        # Format a clean course object as a response
        return Response(
            self._meta.indexer.format_es_object_for_api(
                query_response,
                # Get the best language we can return multilingual fields in
                get_language_from_request(request),
            )
        )
