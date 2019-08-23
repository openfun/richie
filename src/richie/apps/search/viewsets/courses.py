"""
API endpoints to access courses through ElasticSearch
"""
from django.conf import settings

from elasticsearch.exceptions import NotFoundError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .. import ES_CLIENT
from ..defaults import ES_PAGE_SIZE
from ..filter_definitions import FILTERS
from ..indexers import ES_INDICES
from ..utils.viewsets import AutocompleteMixin, ViewSetMetadata


class CoursesViewSet(AutocompleteMixin, ViewSet):
    """
    A simple viewset with GET endpoints to fetch courses
    See API Blueprint for details on consumer use
    """

    _meta = ViewSetMetadata(indexer=ES_INDICES.courses)

    # pylint: disable=no-self-use,unused-argument,too-many-locals
    def list(self, request, version):
        """
        Course search endpoint: build an ElasticSearch request from our query params so
        it searches its index and returns a list of matching courses
        """
        # Instantiate the form to allow validation/cleaning
        form_class = self._meta.indexer.form
        params_form = form_class(data=request.query_params)

        # Return a 400 with error information if the query params are not valid
        if not params_form.is_valid():
            return Response(status=400, data={"errors": params_form.errors})

        limit, offset, query, aggs = params_form.build_es_query()

        body = {
            "script_fields": params_form.get_script_fields(),
            "sort": params_form.get_sorting_script(),
        }

        # The querystring may request only the query or only the aggregations
        scope = params_form.cleaned_data["scope"]
        if form_class.OBJECTS in scope or not scope:
            body["query"] = query

        if form_class.FILTERS in scope or not scope:
            body["aggs"] = aggs

        # pylint: disable=unexpected-keyword-arg
        course_query_response = ES_CLIENT.search(
            _source=getattr(self._meta.indexer, "display_fields", "*"),
            index=self._meta.indexer.index_name,
            doc_type=self._meta.indexer.document_type,
            body=body,
            # Directly pass meta-params through as arguments to the ES client
            from_=offset,
            size=limit or getattr(settings, "RICHIE_ES_PAGE_SIZE", ES_PAGE_SIZE),
        )

        response_object = {
            "meta": {
                "count": len(course_query_response["hits"]["hits"]),
                "offset": offset,
                "total_count": course_query_response["hits"]["total"],
            }
        }
        if form_class.OBJECTS in scope or not scope:
            response_object["objects"] = [
                self._meta.indexer.format_es_object_for_api(es_course)
                for es_course in course_query_response["hits"]["hits"]
            ]

        if form_class.FILTERS in scope or not scope:
            filters = {
                name: faceted_definition
                for filter in FILTERS.values()
                for name, faceted_definition in filter.get_faceted_definitions(
                    course_query_response["aggregations"]["all_courses"],
                    data=params_form.cleaned_data,
                ).items()
            }
            response_object["filters"] = dict(
                sorted(filters.items(), key=lambda f: f[1]["position"])
            )

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
            query_response = ES_CLIENT.get(
                index=self._meta.indexer.index_name,
                doc_type=self._meta.indexer.document_type,
                id=pk,
            )
        except NotFoundError:
            return Response(status=404)

        # Format a clean course object as a response
        return Response(self._meta.indexer.format_es_object_for_api(query_response))
