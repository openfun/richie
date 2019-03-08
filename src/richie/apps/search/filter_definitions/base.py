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

from ..defaults import SEARCH_SORTING_DEFAULT


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
        sorting=SEARCH_SORTING_DEFAULT,
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
            data (Dict): a dictionary mapping the name of filters with the list of
                values selected for each filter. Typically the `cleaned_data` output of
                a valid filter form:
                e.g. {"availability": ["open"], "languages": ["en", "fr"]}
            queries (List[])

        Returns:
        --------
            List[Dict]: a list of dictionaries each mapping the name of a filter with a query
                fragment that will be added to the global Elasticsearch query to apply this
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

    def get_faceted_definitions(self, facets, *args, **kwargs):
        """
        Build the filter definition from a filter's common attributes and its Elasticsearch
        facet results. The frontend uses these definitions to display the filters on the
        user interface (see search page left side bar).

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
                            {"name": "en", "human_name": "English", "count": 3},
                            {"name": "fr", "human_name": "French", "count": 2},
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
            self.name: forms.MultipleChoiceField(
                required=False, choices=self.get_values().items()
            )
        }

    def get_faceted_definitions(self, facets, *args, **kwargs):
        """
        Add the counts to the values from the initial definition to make them complete
        as the frontend expects them.
        """
        # Get filter values to derive human names
        values = self.get_values()

        # for each facet, we derive the value and the count:
        # eg. for facet key `availability@coming_soon`, the value is `coming_soon`
        facet_counts_dict = {
            key.split("@")[1]: facet["doc_count"]
            for key, facet in facets.items()
            if "{:s}@".format(self.name) in key  # 6 times faster than startswith
            and facet["doc_count"] > self.min_doc_count
        }
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
                    {"count": count, "human_name": values[name], "name": name}
                    for name, count in facet_counts
                ],
            }
        }


class NestingWrapper(BaseFilterDefinition):
    """
    A filter definition to aggregate children filter definitions under a nested query.
    """

    def __init__(self, name, filters, path=None):
        """
        The nesting wrapper is instanciated with the list of children filters and the path of
        the nested field under which it will query.
        It instanciates all the children filter definitions and records them as an attribute
        in order to wrap calls to all the common methods:
            - get_form_fields,
            - get_query_fragment,
            - get_aggs_fragment,
            - get_faceted_definitions.
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

        Returns:
            List[Dict]: a list of one dictionary mapping the name of the nesting wrapper with a
                nested query cumulating all the active filters among the nested children.

        For example, if the children return query fragments as follows:
            - availability:
                {
                    'key': 'availability',
                    'fragment': [
                        {
                            'bool': {
                                'must': [{'range': {'course_runs.end': {'lte': '2019-03-08}}}]
                            }
                        }
                    ]
                }
            - languages:
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

        Then the nesting wrapper will return the following list with one aggregated nested query:
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
        Simply add the counts to the values from the initial definition to make them complete
        as the frontend expects them.
        """
        return {
            name: facet_definition
            for fd in self.filter_definitions.values()
            for name, facet_definition in fd.get_faceted_definitions(
                facets, *args, **kwargs
            ).items()
        }
