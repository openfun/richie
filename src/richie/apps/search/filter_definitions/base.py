"""
Define base FilterDefinition classes on which to build actual FilterDefinition classes.
They encapsulate common behavior around managing filters in ElasticSearch queries and
API requests (to validate input) and responses (to produce easy-to-consume filters).
"""
from functools import reduce
from operator import itemgetter

from django import forms
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

from ..defaults import FACET_SORTING_DEFAULT


class BaseFilterDefinition:
    """
    Base filter definition shape: just a skeleton.
    """

    SORTING_CONF, SORTING_COUNT, SORTING_NAME = "conf", "count", "name"

    # pylint: disable=too-many-arguments
    def __init__(
        self,
        name,
        term=None,
        human_name=None,
        is_drilldown=False,
        min_doc_count=0,
        position=0,
        sorting=FACET_SORTING_DEFAULT,
    ):
        """Set common attributes with sensible defaults (only name is required)."""
        self.name = name
        self.term = term or name
        self.human_name = human_name or name
        self.is_drilldown = is_drilldown
        self.min_doc_count = min_doc_count
        self.position = position
        self.sorting = sorting

    def get_form_fields(self):
        """
        Returns:
        --------
            django.forms.fields.Field: the form field instance that will be used to parse
                and validate this filter's values from the querystring.

        To be implemented in each actual FilterDefintion class.
        """
        raise NotImplementedError()

    def get_query_fragment(self, data):
        """
        Build the query fragment to use in the ElasticSearch filter & aggregations.

        Arguments:
        ----------
            data (Dict): a dictionary mapping the name of filters with the list of
                values selected for each filter. Typically the `cleaned_data` output of
                a valid filter form:
                e.g. {"availability": ["open"], "languages": ["en", "fr"]}

        Returns:
        --------
            List[Dict]: a list of dictionaries each mapping the name of a filter with a query
                fragment that must be added to the global Elasticsearch query to apply this
                filter. For example:
                [
                    {
                        "key": "new",
                        "fragment": [{'term': {'is_new': True}}]
                    }
                ]

        To be implemented in each actual FilterDefintion class.
        """
        raise NotImplementedError()

    def get_aggs_fragment(self, queries, *args, **kwargs):
        """
        Build the aggregations fragment to use to extract facets from ElasticSearch.

        Arguments:
        ----------
            queries (List[Dict]): a list of all the query fragments composing the global
                Elasticsearch query and which were collected by calling the `get_query_fragment`
                method of each filter definitions. Each item in the list is a dictionary mapping
                the name of a filter with a query fragment (see above for an example).

        Returns:
        --------
            Dict: a dictionary mapping the name of an aggregation bucket with an aggregation
                fragment that will be added to the global Elasticsearch aggregation query to get
                facet counts related to this filter. For example:
                {
                    # A term aggregation query
                    "categories": {
                        "aggregations": {
                            "categories": {"terms": {"field": "categories"}}
                        },
                    },
                    # A filter aggregation query
                    "new@new": {
                        "filter": {
                            "bool": {
                                "must": [{"term": {"is_new": True}}]
                            }
                        }
                    }
                }

        To be implemented in each actual FilterDefintion class.
        """
        raise NotImplementedError()

    def get_faceted_definitions(self, facets, *args, **kwargs):
        """
        Build the filter definition from a filter's common attributes and its Elasticsearch
        facet results. The frontend uses these definitions to display the filters on the
        user interface (see search page left side bar).

        Arguments:
        ----------
            Dict: a dictionary mapping each aggregation name (one for each aggregation bucket
                defined by the `get_aggs_fragment` method) with its documents counts as returned
                by Elasticsearch in the "aggregations" part of the response.

        Returns:
        --------
            Dict: a dictionary mapping the name of a filter with a dictionary of all the
                information necessary to display the filter on the search page with its
                facet counts. For example:

                {
                    languages: {
                        "human_name": "Languages",
                        "is_drilldown": False,
                        "name": "languages",
                        "values": [
                            {"key": "en", "human_name": "English", "count": 3},
                            {"key": "fr", "human_name": "French", "count": 2},
                        ],
                    }
                }

        To be implemented in each actual FilterDefintion class.
        """
        raise NotImplementedError()


class BaseChoicesFilterDefinition(BaseFilterDefinition):
    """
    A base filter definition to filter on a field that has a pre-defined list of possible
    values. The values and their related query fragment must be defined in the actual filter
    class.
    """

    def get_values(self):
        """
        Get the possible values for this choice filter.

        Returns:
        --------
            Dict: a dictionary mapping the machine name of a value with its human name.
                For example: {"is_new": "First session", "is_repeat": "Repeat session"}
        """
        raise NotImplementedError()

    def get_fragment_map(self):
        """
        Get the possible query fragments for this choice filter.

        Returns:
        --------
            Dict: a dictionary mapping the machine name of a value with its human name.
                For example:
                {
                    "is_new": [{"term": {"is_new": True}}],
                    "is_repeat": [{"term": {"is_new": False}}],
                }
        """
        raise NotImplementedError()

    def get_form_fields(self):
        """Choice filters are validated with a MultipleChoiceField."""
        return {
            self.name: (
                forms.MultipleChoiceField(
                    required=False, choices=self.get_values().items()
                ),
                True,  # a MultipleChoiceField expects list values
            )
        }

    def get_faceted_definitions(self, facets, *args, **kwargs):
        """
        Add the counts to the values from the initial definition to make them complete
        and sorted as the frontend expects them.
        """
        # Get filter values to derive human names
        values = self.get_values()

        # for each facet, we derive the value and the count:
        # eg. for facet key `availability@coming_soon`, the value is `coming_soon`
        facet_counts_dict = {
            key.split("@")[1]: facet["doc_count"]
            for key, facet in facets.items()
            if "{:s}@".format(self.name) in key  # 6 times faster than startswith
            and facet["doc_count"] >= self.min_doc_count
        }

        # Sort facets as requested
        if self.sorting == self.SORTING_NAME:
            # Alphabetical ascending sorting
            facet_counts = sorted(facet_counts_dict.items(), key=itemgetter(0))
        elif self.sorting == self.SORTING_COUNT:
            # Sorting by descending facet count
            facet_counts = sorted(
                facet_counts_dict.items(), key=itemgetter(1), reverse=True
            )
        elif self.sorting == self.SORTING_CONF:
            # Respect the order set in filter definitions
            facet_counts = [
                (name, facet_counts_dict[name])
                for name in values
                if name in facet_counts_dict
            ]
        else:
            raise ImproperlyConfigured(
                'Facet sorting should be one of "conf", "count" or "name"'
            )

        return {
            self.name: {
                # We always need to pass the base definition to the frontend
                "human_name": self.human_name,
                "is_drilldown": self.is_drilldown,
                "name": self.name,
                "position": self.position,
                "values": [
                    {"count": count, "human_name": values[name], "key": name}
                    for name, count in facet_counts
                ],
            }
        }


class NestingWrapper(BaseFilterDefinition):
    """
    A filter definition to aggregate children filter definitions under a nested query.

    This is necessary to use filters and aggregations on values that live in nested fields.
    Such as any information that is linked not directly to courses but to course runs (a nested
    field of courses).
    """

    def __init__(self, name, filters, path=None):
        """
        Instanciate all the children filter definitions and record them as an attribute
        in order to wrap calls to all the common methods:
            - get_form_fields,
            - get_query_fragment,
            - get_aggs_fragment,
            - get_faceted_definitions.

        Arguments:
        ----------
            name (string): the name of the nesting wrapper (not really a filter definition as it
                just collects queries/aggs from  its children.
            filters (List[Tuple]): list of children filters to be instantiated, each defined by
                a tuple of 2 elements:
                - class: dotted path pointing to the filter definition class to be instiated,
                - kwargs: dictionary of the keyword arguments to instantiate the children filter
                    definitions.
            path (string): the name of the nested field under which children filters will query.
                optional as it defaults to the value passed for the `name` argument.
        """
        super().__init__(name)
        self.path = path or name
        self.filter_definitions = {
            params["name"]: import_string(dotted_path)(
                term="{:s}.{:s}".format(self.path, params["name"]), **params
            )
            for dotted_path, params in filters
        }

    def get_form_fields(self):
        """
        Aggregate form fields from the nested children in a mapping.

        Returns:
        --------
            Dict: dictionary mapping the key of each children filter definition with its
                formfield. The form thus gets at the same level the fields for nested filters
                and normal filters.

                As a result, filtering on a nested field is transparent in the querystring.
        """
        return reduce(
            lambda key_field_map, filter_definition: {
                **key_field_map,
                **filter_definition.get_form_fields(),
            },
            self.filter_definitions.values(),
            {},
        )

    def get_query_fragment(self, data):
        """
        Aggregate query fragments from the nested children in a list of mappings.

        Arguments:
        ----------
            data (Dict): a dictionary mapping the name of filters with the list of
                values selected for each filter. Typically the `cleaned_data` output of
                a valid filter form:
                e.g. {"availability": ["open"], "languages": ["en", "fr"]}

        Returns:
        --------
            List[Dict]: a list of one dictionary mapping the name of the nesting wrapper with a
                nested query cumulating all the active filters among the nested children.

        For example, if the children return query fragments as follows:
            - availability (archived):
                {
                    'key': 'availability',
                    'fragment': [
                        {
                            'bool': {
                                'must': [{'range': {'course_runs.end': {'lte': '2019-03-08'}}}]
                            }
                        }
                    ]
                }
            - languages (french or english):
                {
                    'key': 'languages',
                    'fragment': [
                        {
                            'bool': {
                                'must': [{'terms': {'course_runs.languages': ['en', 'fr']}}]
                            }
                        }
                    ]
                }

        Then the nesting wrapper should return a list with one aggregated nested query:
        [
            {
                'key': 'course_runs',
                'fragment': [
                    {
                        'nested': {
                            'path': 'course_runs',
                            'query': {
                                'bool': {
                                    'must': [
                                        {'range': {'course_runs.end': {'lte': '2019-03-08}}},
                                        {'terms': {'course_runs.languages': ['en', 'fr']}},
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        ]
        """
        queries = [
            kf_pair
            for fd in self.filter_definitions.values()
            for kf_pair in fd.get_query_fragment(data)
        ]
        nested_query = {
            "bool": {
                "must":
                # queries => map(pluck("fragment")) => flatten()
                [clause for kf_pair in queries for clause in kf_pair["fragment"]]
            }
        }
        return (
            [
                {
                    "key": self.name,
                    "fragment": [
                        {"nested": {"path": self.path, "query": nested_query}}
                    ],
                }
            ]
            if queries
            else []
        )

    # pylint: disable=arguments-differ
    def get_aggs_fragment(self, queries, data, *args, **kwargs):
        """
        Collect aggregations fragments from the nested children in a mapping.

        Arguments:
        ----------
            queries (List[Dict]): a list of all the query fragments composing the global
                Elasticsearch query and which were collected by calling the `get_query_fragment`
                method of each filter definitions. Each item in the list is a dictionary mapping
                the name of a filter with a query fragment (see above for an example).
            data (Dict): a dictionary mapping the name of filters with the list of
                values selected for each filter. Typically the `cleaned_data` output of
                a valid filter form:
                e.g. {"availability": ["open"], "languages": ["en", "fr"]}

        Returns:
        --------
            List[Dict]:a dictionary mapping the name of aggregation buckets for all the children
                the nesting wrapper, with an aggregation fragment that will be added to the
                global Elasticsearch aggregation query to get facet counts related to this value.

                We can't use term query to face on nested fields because what want to count is the
                number of courses that are not excluded by the applied filters, not the number of
                occurence of a value on a nested field that may be repeated under a given course!
                We can only use "filter" aggregations based on a nested query that excludes the
                current value on which we are facetting.

                For example, when filering on archived courses in french or english, the nested
                query is:
                [
                    {
                        'key': 'course_runs',
                        'fragment': [
                            {
                                'nested': {
                                    'path': 'course_runs',
                                    'query': {
                                        'bool': {
                                            'must': [
                                                {'range': {
                                                    'course_runs.end': {'lte': '2019-03-08'}}
                                                },
                                                {'terms': {'course_runs.languages': ['en', 'fr']}},
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]

                The aggregations buckets on values of the nested fields should look as follows.

                - To count on-going courses respecting this query:
                'availability@ongoing': {
                    'filter': {'bool': {'must': [
                        {'nested': {
                            'path': 'course_runs',
                            'query': {'bool': {'must': [
                                {'range': {'course_runs.start': {'lte': '2019-03-08'}}},
                                {'range': {'course_runs.end': {'gte': '2019-03-08}}},
                                {'terms': {'course_runs.languages': ['en']}},
                            ]}},
                        }},
                    ]}},
                }

                - To count french courses respecting this query:
                'languages@de': {
                    'filter': {'bool': {'must': [
                        {'nested': {
                            'path': 'course_runs',
                            'query': {'bool': {'must': [
                                {'range': {'course_runs.end': {'lte': '2019-03-08'}}},
                                {'terms': {'course_runs.languages': ['fr']}},
                            ]}},
                        }},
                    ]}},
                }

                These queries seem very difficult to build but luckily, the nesting wrapper
                (parent) knows how to build this nested queries via its `get_query_fragment`
                method. So we start by removing the nested query (as calculated with active
                filters) from the list of active queries and pass the parent as argument to
                each children so the children can rebuild the query for each of the value,
                excluding values one-by-one.
        """
        # Remove the query fragment built by this nesting wrapper. The children will call the
        # parent's `get_query_fragment` with specific data to build aggregation queryies one-
        # by-one.
        stripped_queries = list(
            filter(lambda query_fragment: query_fragment["key"] != self.name, queries)
        )

        aggs = {}
        for filter_definition in self.filter_definitions.values():
            aggs.update(
                filter_definition.get_aggs_fragment(
                    stripped_queries, data, parent=self, *args, **kwargs
                )
            )
        return aggs

    def get_faceted_definitions(self, facets, *args, **kwargs):
        """
        Collect facet definitions from the children filter definitions in a dictionary.
        """
        return {
            name: facet_definition
            for fd in self.filter_definitions.values()
            for name, facet_definition in fd.get_faceted_definitions(
                facets, *args, **kwargs
            ).items()
        }
