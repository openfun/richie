"""
Validate and clean request parameters for our endpoints using Django forms
"""
from datetime import MAXYEAR
from functools import reduce

from django import forms

import arrow

from .defaults import FILTERS, RELATED_CONTENT_MATCHING_BOOST
from .filter_definitions import AvailabilityFilterDefinition

# Instanciate filter fields for each filter defined in settings
FILTER_FIELDS = {
    key: value
    for filter_definition in FILTERS.values()
    for key, value in filter_definition.get_form_fields().items()
}


class SearchForm(forms.Form):
    """Validate the query string params in a search request."""

    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    query = forms.CharField(required=False, min_length=3, max_length=100)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)


class CourseSearchForm(SearchForm):
    """
    Validate the query string params in the course search request, connect them to filter
    definitions and generate Elasticsearch queries.
    """

    def __init__(self, *args, data=None, **kwargs):
        """
        Adapt the search form to handle filters:
        - Fix the QueryDict value getter to properly handle multi-value parameters,
        - Add a field instance to the form for each filter.
        """
        # QueryDict/MultiValueDict breaks lists: we need to fix it
        data_fixed = {
            k: data.getlist(k) if k in FILTER_FIELDS else v[0] for k, v in data.lists()
        }

        super().__init__(data=data_fixed, *args, **kwargs)
        self.fields.update(FILTER_FIELDS)

    def get_list_sorting_script(self):
        """
        Call the relevant sorting script for courses lists, regenerating the parameters on each
        call. This will allow the ms_since_epoch value to stay relevant even if the ES instance
        and/or the Django server are long running.

        The list of languages and states are passed to the script because the context fo the
        search defines which course runs are relevant or not for sorting.

        Note: we use script storage to save time on the script compilation, which is an expensive
        operation. We'll only do it once at bootstrap time.
        """
        # Determine the states relevant with this level of filtering on availabilities
        availabilities = self.cleaned_data.get("availability", [])
        if AvailabilityFilterDefinition.OPEN in availabilities:
            states = [0, 1]
        elif AvailabilityFilterDefinition.ONGOING in availabilities:
            states = [0, 4]
        elif AvailabilityFilterDefinition.COMING_SOON in availabilities:
            states = [1, 2, 3]
        elif AvailabilityFilterDefinition.ARCHIVED in availabilities:
            states = [5]
        else:
            states = None

        return {
            "_script": {
                "order": "asc",
                "script": {
                    "id": "sort_list",
                    "params": {
                        "languages": self.cleaned_data.get("languages") or None,
                        "states": states,
                        "max_date": arrow.get(MAXYEAR, 12, 31).timestamp * 1000,
                        "ms_since_epoch": arrow.utcnow().timestamp * 1000,
                    },
                },
                "type": "number",
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
            queries.append(
                {
                    "key": "query",
                    "fragment": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "multi_match": {
                                            "fields": ["description.*", "title.*"],
                                            "query": full_text,
                                            "type": "cross_fields",
                                        }
                                    },
                                    {
                                        "multi_match": {
                                            "boost": RELATED_CONTENT_MATCHING_BOOST,
                                            "fields": [
                                                "categories_names.*",
                                                "organizations_names.*",
                                            ],
                                            "query": full_text,
                                            "type": "cross_fields",
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

        # Default to a match_all query
        if not queries:
            query = {"match_all": {}}
        else:
            # Concatenate all the sub-queries lists together to form the queries list
            query = {
                "bool": {
                    "must":
                    # queries => map(pluck("fragment")) => flatten()
                    [clause for kf_pair in queries for clause in kf_pair["fragment"]]
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
