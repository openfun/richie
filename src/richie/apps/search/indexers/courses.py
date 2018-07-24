"""
ElasticSearch course document management utilities
"""
from django.conf import settings

from ..defaults import RESOURCE_FACETS
from ..exceptions import IndexerDataException, QueryFormatException
from ..forms import CourseListForm
from ..partial_mappings import MULTILINGUAL_TEXT
from ..utils.api_consumption import walk_api_json_list
from ..utils.i18n import get_best_field_language


class CoursesIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    document_type = "course"
    index_name = "richie_courses"
    mapping = {
        "dynamic_templates": MULTILINGUAL_TEXT,
        "properties": {
            "end_date": {"type": "date"},
            "enrollment_end_date": {"type": "date"},
            "enrollment_start_date": {"type": "date"},
            "language": {"type": "keyword"},
            "organizations": {"type": "keyword"},
            "session_number": {"type": "integer"},
            "start_date": {"type": "date"},
            "subjects": {"type": "keyword"},
            "thumbnails": {
                "properties": {
                    "about": {"type": "text", "index": False},
                    "big": {"type": "text", "index": False},
                    "facebook": {"type": "text", "index": False},
                    "small": {"type": "text", "index": False},
                },
                "type": "object",
            },
        },
    }

    @classmethod
    def get_data_for_es(cls, index, action):
        """
        Load all the courses from the API and format them for the ElasticSearch index
        """
        content_pages = walk_api_json_list(settings.COURSE_API_ENDPOINT)

        for content_page in content_pages:
            try:
                for course in content_page["results"]:
                    yield {
                        "_id": course["id"],
                        "_index": index,
                        "_op_type": action,
                        "_type": cls.document_type,
                        "end_date": course["end_date"],
                        "enrollment_end_date": course["enrollment_end_date"],
                        "enrollment_start_date": course["enrollment_start_date"],
                        "language": course["language"],
                        "organization_main": course["main_university"]["id"],
                        "organizations": [org["id"] for org in course["universities"]],
                        "session_number": course["session_number"],
                        "short_description": {
                            course["language"]: course["short_description"]
                        },
                        "start_date": course["start_date"],
                        "subjects": [subject["id"] for subject in course["subjects"]],
                        "thumbnails": course["thumbnails"],
                        "title": {course["language"]: course["title"]},
                    }
            except KeyError:
                raise IndexerDataException("Unexpected data shape in courses to index")

    @staticmethod
    def format_es_course_for_api(es_course, best_language):
        """
        Format a course stored in ES into a consistent and easy-to-consume record for
        API consumers
        """
        return {
            "end_date": es_course["_source"]["end_date"],
            "enrollment_end_date": es_course["_source"]["enrollment_end_date"],
            "enrollment_start_date": es_course["_source"]["enrollment_start_date"],
            "id": es_course["_id"],
            "language": es_course["_source"]["language"],
            "organization_main": es_course["_source"]["organization_main"],
            "organizations": es_course["_source"]["organizations"],
            "session_number": es_course["_source"]["session_number"],
            "short_description": get_best_field_language(
                es_course["_source"]["short_description"], best_language
            ),
            "start_date": es_course["_source"]["start_date"],
            "subjects": es_course["_source"]["subjects"],
            "thumbnails": es_course["_source"]["thumbnails"],
            "title": get_best_field_language(
                es_course["_source"]["title"], best_language
            ),
        }

    @staticmethod
    def build_es_query(request):
        """
        Build an ElasticSearch query and its related aggregations, to be consumed by the ES client
        in the Courses ViewSet
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

        # Raise an exception with error information if the query params are not valid
        if not params_form.is_valid():
            raise QueryFormatException(params_form.errors)

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
                    for facet in RESOURCE_FACETS
                },
            }
        }

        return (
            params_form.cleaned_data.get("limit"),
            params_form.cleaned_data.get("offset") or 0,
            query,
            aggs,
        )
