"""
API endpoints to access courses through ElasticSearch
"""
from django.conf import settings
from django.utils.module_loading import import_string
from django.utils.translation import get_language_from_request

from elasticsearch.exceptions import NotFoundError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from ..forms import CourseListForm


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
        # QueryDict/MultiValueDict breaks lists: we need to normalize them
        # Unpacking does not trigger the broken accessor so we get the proper value
        params_form_values = {
            k: v[0] if len(v) == 1 else v for k, v in request.query_params.lists()
        }
        # Use QueryDict/MultiValueDict as a shortcut to make sure we get arrays for these two
        # fields, which should be arrays even if their length is one
        params_form_values["organizations"] = request.query_params.getlist(
            "organizations"
        )
        params_form_values["subjects"] = request.query_params.getlist("subjects")
        # Instantiate the form to allow validation/cleaning
        params_form = CourseListForm(params_form_values)

        # Return a 400 with error information if the query params are not as expected
        if not params_form.is_valid():
            return Response(status=400, data={"errors": params_form.errors})

        # Define our aggregations names, for our ES query, which will match with the field
        # names on the objects & the facets we return on the API response
        facets = ["organizations", "subjects"]

        # Note: test_elasticsearch_feature.py needs to be updated whenever the search call
        # is updated and makes use new features.
        # queries is an array of individual queries that will be combined through "bool" before
        # we pass them to ES. See the docs en bool queries.
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
        queries = []
        for param, value in params_form.cleaned_data.items():
            # Skip falsy values as we're not using them in our query
            if not value:
                continue

            # The datetimerange fields are all translated to the ES query DSL the same way
            if param in [
                "end_date",
                "enrollment_end_date",
                "enrollment_start_date",
                "start_date",
            ]:
                # Add the relevant range criteria to the queries
                start, end = value
                queries = [
                    *queries,
                    {
                        "range": {
                            param: {
                                "gte": start.datetime if start else None,
                                "lte": end.datetime if end else None,
                            }
                        }
                    },
                ]

            # organizations & subjects are both array of related element IDs
            elif param in ["organizations", "subjects"]:
                # Add the relevant term search to our queries
                queries = [*queries, {"terms": {param: value}}]

            # Search is a regular (multilingual) match query
            elif param == "query":
                queries = [
                    *queries,
                    {
                        "multi_match": {
                            "fields": ["short_description.*", "title.*"],
                            "query": value,
                            "type": "cross_fields",
                        }
                    },
                ]

        # Default to a match_all query
        if not queries:
            query = {"match_all": {}}
        else:
            query = {"bool": {"must": queries}}

        # Build organizations and subjects terms aggregations for our query
        aggs = {
            "all_courses": {
                "global": {},
                "aggregations": {
                    facet: {
                        "filter": {
                            "bool": {
                                "must": [
                                    query
                                    for query in queries
                                    if "terms" not in query
                                    or facet not in query.get("terms")
                                ]
                            }
                        },
                        "aggregations": {facet: {"terms": {"field": facet}}},
                    }
                    for facet in facets
                },
            }
        }

        course_query_response = settings.ES_CLIENT.search(
            index=self.indexer.index_name,
            doc_type=self.indexer.document_type,
            body={"aggs": aggs, "query": query},
            # Directly pass meta-params through as arguments to the ES client
            from_=params_form.cleaned_data.get("offset") or 0,
            size=params_form.cleaned_data.get("limit") or settings.ES_DEFAULT_PAGE_SIZE,
        )

        response_object = {
            "meta": {
                "count": len(course_query_response["hits"]["hits"]),
                "offset": params_form.cleaned_data.get("offset") or 0,
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
