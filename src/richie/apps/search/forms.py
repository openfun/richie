"""
Validate and clean request parameters for our endpoints using Django forms
"""
from functools import reduce

from django import forms
from django.conf import settings
from django.utils.translation import get_language

import arrow

from richie.apps.courses.models import CourseState

from .defaults import QUERY_ANALYZERS, RELATED_CONTENT_BOOST
from .filter_definitions import FILTERS, AvailabilityFilterDefinition

# Instantiate filter fields for each filter defined in settings
# It is of the form:
#     {
#         subjects: (
#             ArrayField(required=False, base_type=forms.CharField(max_length=50)),
#             True,
#         ),
#         subjects_include: (
#             CharField(required=False, max_length=20),
#             False,
#         ),
#         languages: (
#             MultipleChoiceField(required=False, choices=LANGUAGES),
#             True,
#         ),
#     }
# Where the first item is an instance of the form field and the second is a boolean
# indicating whether this formfield expects a list or a single value.
FILTER_FIELDS = {
    key: value
    for filter_definition in FILTERS.values()
    for key, value in filter_definition.get_form_fields().items()
}


class SearchForm(forms.Form):
    """Validate the query string params in a search request."""

    OBJECTS, FILTERS = "objects", "filters"

    SCOPE_CHOICES = ((OBJECTS, "Objects"), (FILTERS, "Filters"))

    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    query = forms.CharField(required=False, min_length=3, max_length=100)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)
    scope = forms.ChoiceField(required=False, choices=SCOPE_CHOICES)


class CourseSearchForm(SearchForm):
    """
    Validate the query string params in the course search request, connect them to filter
    definitions and generate Elasticsearch queries.
    """

    def __init__(self, *args, data=None, **kwargs):
        """
        Adapt the search form to handle filters:
        - Fix the QueryDict value getter to properly handle multi-value parameters,
        - Add a field instance to the form for each filter,
        - Define the `states` property as it is used by several methods.
        """
        # QueryDict/MultiValueDict breaks lists: we need to fix it
        data_fixed = (
            {
                k: data.getlist(k)
                # Form fields are marked to expect lists as input or not as explained above
                if (k in FILTER_FIELDS and FILTER_FIELDS[k][1] is True) else v[0]
                for k, v in data.lists()
            }
            if data
            else {}
        )

        super().__init__(data=data_fixed, *args, **kwargs)
        self.fields.update({k: v[0] for k, v in FILTER_FIELDS.items()})
        self.states = None

    def clean_availability(self):
        """
        Calculate and set the list of states relevant with the current availability filter.
        e.g. if we filter on OPEN courses, only the course runs in state 0 (ongoing open) or
        1 (future open) should be considered for sorting and computation of the course's state.
        """
        availabilities = self.cleaned_data.get("availability", [])
        if AvailabilityFilterDefinition.OPEN in availabilities:
            self.states = [
                CourseState.ONGOING_OPEN,
                CourseState.FUTURE_OPEN,
                CourseState.ARCHIVED_OPEN,
            ]
        elif AvailabilityFilterDefinition.ONGOING in availabilities:
            self.states = [CourseState.ONGOING_OPEN, CourseState.ONGOING_CLOSED]
        elif AvailabilityFilterDefinition.COMING_SOON in availabilities:
            self.states = [
                CourseState.FUTURE_OPEN,
                CourseState.FUTURE_NOT_YET_OPEN,
                CourseState.FUTURE_CLOSED,
            ]
        elif AvailabilityFilterDefinition.ARCHIVED in availabilities:
            self.states = [CourseState.ARCHIVED_OPEN, CourseState.ARCHIVED_CLOSED]

        return availabilities

    def get_script_fields(self):
        """
        Build the part of the Elasticseach query that defines script fields ie fields that can not
        be indexed because they are dynamic and shoud be calculated at query time:
        - languages and states: depend on the filters applied by the user so that we only take into
          consideration course runs that are interesting for this search.
        - ms_since_epoch: evolves with time to stay relevant on course dates even if the ES
          instance and/or the Django server are long running.

        Note: we use script storage to save time on the script compilation, which is an expensive
        operation. We'll only do it once at bootstrap time.
        """
        return {
            "state": {
                "script": {
                    "id": "state_field",
                    "params": {
                        "languages": self.cleaned_data.get("languages") or None,
                        "ms_since_epoch": arrow.utcnow().int_timestamp * 1000,
                        "states": self.states,
                    },
                }
            }
        }

    def get_queries(self):
        """
        Aggregate queries from each filter definition.
        The full text query is treated directly as it does not require heavy lifting.

        Returns:
        --------
            List[Dict]: a list of dictionaries each mapping the name of a filter with a query
                fragment that composes the global Elasticsearch query. For example:
                [
                    {
                        "key": "new",
                        "fragment": [{'term': {'is_new': True}}]
                    }
                    ...
                ]
        """
        queries = []

        # Add the query fragments of each filter definition to the list of queries
        for filter_definition in FILTERS.values():
            queries = queries + filter_definition.get_query_fragment(self.cleaned_data)

        # Full text search is a regular (multilingual) match query
        full_text = self.cleaned_data.get("query")
        if full_text:
            related_content_boost = getattr(
                settings, "RICHIE_RELATED_CONTENT_BOOST", RELATED_CONTENT_BOOST
            )
            lang = get_language()
            queries.append(
                {
                    "key": "query",
                    "fragment": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "multi_match": {
                                            "analyzer": QUERY_ANALYZERS[lang],
                                            "fields": [
                                                "description.*",
                                                "introduction.*",
                                                "title.*^50",
                                                f"categories_names.*^{related_content_boost}",
                                                f"organizations_names.*^{related_content_boost}",
                                                f"persons_names.*^{related_content_boost}",
                                            ],
                                            "query": full_text,
                                            "type": "best_fields",
                                        }
                                    },
                                    # Boost exact code matches so that they jump our state buckets
                                    # A closed course with a perfect code match should be
                                    # displayed before an open course with no perfect code match
                                    {
                                        "match": {
                                            "code": {
                                                "query": full_text,
                                                "analyzer": "code",
                                                "boost": 3000,
                                            }
                                        }
                                    },
                                    {
                                        "match": {
                                            "code": {
                                                "query": full_text,
                                                "analyzer": "code",
                                                "fuzziness": "AUTO",
                                            }
                                        }
                                    },
                                ]
                            }
                        }
                    ],
                }
            )

        return queries

    def build_es_query(self):
        """
        Build the actual Elasticsearch search query and aggregation query from the fragments
        returned by each filter definition.

        Returns:
        --------
            Tuple:
            - limit (int): the maximum number of results to be returned by Elasticsearch,
            - offset (int): the offset from which results are returned (for pagination),
            - query (Dict): the raw Elasticsearch query as per:
              https://elastic.co/guide/en/elasticsearch/reference/current/search.html
            - aggs (Dict): the raw Elasticsearch aggregation as per:
              https://elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html

        """
        # queries is an array of individual queries that will be combined through "bool" before
        # we pass them to ES. See the docs on bool queries.
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
        queries = self.get_queries()

        # Concatenate all the sub-queries lists together to form the queries list
        query = {
            "function_score": {
                "query": {
                    "bool": {
                        # Always filter out courses that are not flagged for listing
                        "filter": {"term": {"is_listed": True}},
                        "must":
                        # queries => map(pluck("fragment")) => flatten()
                        [
                            clause
                            for kf_pair in queries
                            for clause in kf_pair["fragment"]
                        ],
                    }
                },
                "boost_mode": "replace",
                "script_score": {
                    "script": {
                        "id": "score",
                        "params": {
                            "languages": self.cleaned_data.get("languages") or None,
                            "ms_since_epoch": arrow.utcnow().timestamp() * 1000,
                            "states": self.states,
                        },
                    }
                },
            }
        }

        # Concatenate our hardcoded filters query fragments with organizations and categories
        # terms aggregations build on-the-fly
        aggs = {
            "all_courses": {
                "global": {},
                "aggregations": reduce(
                    # Merge all the partial aggregations dicts together
                    lambda acc, aggs_fragment: {**acc, **aggs_fragment},
                    # Generate a partial aggregations dict (an aggs_fragment) for each filter
                    [
                        filter.get_aggs_fragment(queries, self.cleaned_data)
                        for filter in FILTERS.values()
                    ],
                    {},
                ),
            }
        }

        return (
            self.cleaned_data.get("limit"),
            self.cleaned_data.get("offset") or 0,
            query,
            aggs,
        )


class ItemSearchForm(SearchForm):
    """Generate Elasticsearch queries for the category/organization indices."""

    def __init__(self, *args, data=None, **kwargs):
        """Fix the QueryDict value getter to properly handle multi-value parameters."""
        # QueryDict/MultiValueDict breaks lists: we need to fix it
        data_fixed = {k: v[0] for k, v in data.lists()} if data else {}
        super().__init__(data=data_fixed, *args, **kwargs)

    def build_es_query(self, kind=None):
        """
        Build the actual Elasticsearch search query for category/organization indices.

        Returns:
        --------
            Tuple:
            - limit (int): the maximum number of results to be returned by Elasticsearch,
            - offset (int): the offset from which results are returned (for pagination),
            - query (Dict): the raw Elasticsearch query as per:
              https://elastic.co/guide/en/elasticsearch/reference/current/search.html

        """
        # Create an array to put the clauses of our bool/must query
        clauses = []

        # Add a term filter by kind for the objects that need it (eg. `kind="subjects"`)
        if kind:
            clauses.append({"term": {"kind": kind}})

        # Add a match on the name field if it was handed by the client
        full_text = self.cleaned_data.get("query")
        if full_text:
            clauses.append(
                {
                    "multi_match": {
                        "analyzer": QUERY_ANALYZERS[get_language()],
                        "fields": ["title.*"],
                        "query": full_text,
                    }
                }
            )

        # Build the query around the clauses if there are any
        if clauses:
            query = {"query": {"bool": {"must": clauses}}}
        # Build a match_all query by default
        else:
            query = {"query": {"match_all": {}}}

        return (
            self.cleaned_data.get("limit"),
            self.cleaned_data.get("offset") or 0,
            query,
        )
