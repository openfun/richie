"""
Define our default FilterDefinition classes.
They encapsulate common behavior around managing filters in ElasticSearch queries and
API requests (to validate input) and responses (to produce easy-to-consume filters).
"""
from functools import reduce

from django.conf import settings
from django.utils.module_loading import import_string

from .i18n import get_best_field_language


class FilterDefinitionBase:
    """
    Base filter definition shape: just an init method to set common attributes.
    """

    def __init__(self, name, human_name, is_drilldown=False):
        """
        Assign the common attributes and set some defaults for optional parameters.
        """
        self.name = name
        self.human_name = human_name
        self.is_drilldown = is_drilldown


class FilterDefinitionCustom(FilterDefinitionBase):
    """
    Filter definition for a custom filter with hardcoded choices provided along with their
    ES filtering fragment.
    """

    def __init__(self, name, human_name, choices, **kwargs):
        """
        Extend the base filter definition with tools to easily generate query/aggregation
        fragments and faceted filter definition.
        """
        super().__init__(name, human_name, **kwargs)
        # The key/fragment map is static and helpful to get query & aggregations fragments
        self._key_fragment_map = {choice[0]: choice[2] for choice in choices}
        # Extend the base filter definition with a list of values that includes names & human
        # names and is only missing the counts.
        # We do this because:
        #   - the number of choices is bounded as it is a static argument (as opposed to eg.)
        #     a row in the database;
        #   - it makes it easier to access the values by key with every search request if we
        #     use a dict (while keeping a simpler interface for richie lib users).
        self.values = {
            value_name: {"human_name": value_human_name, "key": value_name}
            for value_name, value_human_name, _ in choices
        }

    def get_query_fragment(self, value_list):
        """
        Build the query fragment to use in the ElasticSearch filter & aggregations.
        """
        # For custom filters, we pick the hardcoded fragment from the corresponding choices
        return [
            {"key": self.name, "fragment": self._key_fragment_map[value]}
            for value in value_list
        ]

    def get_aggs_fragment(self, queries):
        """
        Build the aggregations fragment to use to extract aggregations from ElasticSearch.
        """
        return {
            # Create a custom aggregation for each possible choice for this filter
            # eg `availability@coming_soon` & `availability@current` & `availability@open`
            "{:s}@{:s}".format(self.name, choice_key): {
                "filter": {
                    "bool": {
                        # Use all the query fragments from the queries *but* the one(s) that
                        # filter on the current filter: we manually add back the only one that
                        # is relevant to the current choice.
                        "must": choice_fragment
                        + [
                            # queries
                            # |> filter(kv_pair["key"] != self.name)
                            # |> map(pluck("fragment"))
                            # |> flatten()
                            clause
                            for kf_pair in queries
                            for clause in kf_pair["fragment"]
                            if kf_pair["key"] is not self.name
                        ]
                    }
                }
            }
            for choice_key, choice_fragment in self._key_fragment_map.items()
        }

    def get_faceted_definition(self, facets, _):
        """
        Simply add the counts to the values from the initial definition to make them complete
        as the frontend expects them.
        """
        return {
            # We always need to pass the base definition to the frontend
            "human_name": self.human_name,
            "is_drilldown": self.is_drilldown,
            "name": self.name,
            "values": [
                {
                    # Use the current value's name and human_name from the initial definition
                    # eg. for `availability@coming_soon` we pick self.values["comin_soon"]
                    **self.values[facet_name[facet_name.find("@") + 1 :]],  # noqa: E203
                    # Add the facet count
                    "count": facets[facet_name]["doc_count"],
                }
                # Operate from the facets as opposed to the filter definition to keep a more
                # flexible base that can support various ways to pick a subset of values for
                # which to show facets
                for facet_name in filter(
                    lambda fct_name: fct_name.startswith("{:s}@".format(self.name)),
                    facets,
                )
            ],
        }


class FilterDefinitionTerms(FilterDefinitionBase):
    """
    Filter definition for a terms-based filter. The choices are generated dynamically from
    the incoming facets to avoid having to hold in memory or iterate over an unbounded
    number of choices.
    """

    def get_query_fragment(self, value_list):
        """
        Build the query fragment to use in the ElasticSearch filter & aggregations.
        """
        # For terms filters, as the name implies, it's a simple terms fragment
        return [{"key": self.name, "fragment": [{"terms": {self.name: value_list}}]}]

    def get_aggs_fragment(self, queries):
        """
        Build the aggregations fragment to use to extract aggregations from ElasticSearch.
        """
        return {
            self.name: {
                # Rely on the built-in "terms" aggregation to get everything we need
                "aggregations": {self.name: {"terms": {"field": self.name}}},
                "filter": {
                    "bool": {
                        # Use all the query fragments from the queries *but* the one(s) that
                        # filter on the current filter, as it is handled by ElasticSearch for us
                        "must": [
                            # queries
                            # |> filter(kv_pair["key"] != self.name)
                            # |> map(pluck("fragment"))
                            # |> flatten()
                            clause
                            for kf_pair in queries
                            for clause in kf_pair["fragment"]
                            if kf_pair["key"] is not self.name
                        ]
                    }
                },
            }
        }

    def get_i18n_names(self, keys, language):
        """
        Helper method to get the corresponding internationalized human name for each key in
        a list of indexed objects' ids.
        This covers the base case for terms eg. other models in their own ElasticSearch index
        like organizations or categories
        """
        indexer = import_string(getattr(settings.ES_INDICES, self.name))

        # Get just the documents we need from ElasticSearch
        search_query_response = settings.ES_CLIENT.search(
            # We only need the titles to get the i18n names
            _source=["title.*"],
            index=indexer.index_name,
            doc_type=indexer.document_type,
            body={
                "query": {
                    "terms": {
                        "_uid": [
                            "{:s}#{:s}".format(indexer.document_type, key)
                            for key in keys
                        ]
                    }
                }
            },
            size=len(keys),
        )

        # Extract the best available language here to avoid handling these kinds of implementation
        # details in the ViewSet
        return {
            doc["_id"]: get_best_field_language(doc["_source"]["title"], language)
            for doc in search_query_response["hits"]["hits"]
        }

    def get_faceted_definition(self, facets, language):
        """
        Build the filter definition's values from base definition and the faceted keys.
        Those provide us with the keys and counts that we just have to consume. We resort to
        another method to get the internationalized names so specific filter definitions
        (ie subclasses) can have different ways to get those.
        """
        # Convert the keys & counts from ElasticSearch facets to a more readily consumable format
        #   {
        #       self.name: {
        #           self.name: {
        #               "buckets": [
        #                   {"key": "A", "count": x}
        #                   {"key": "B", "count": y}
        #                   {"key": "C", "count": z}
        #               ]
        #           }
        #       }
        #   }
        # 👆 becomes 👇
        #   {"A": x, "B": y, "C": z}
        key_count_map = reduce(
            lambda agg, key_count_dict: {
                **agg,
                key_count_dict["key"]: key_count_dict["doc_count"],
            },
            facets[self.name][self.name]["buckets"],
            {},
        )

        # Use the passed in callback to get internationalized names for all our keys
        key_i18n_name_map = self.get_i18n_names(
            [key for key in key_count_map], language
        )

        return {
            # We always need to pass the base definition to the frontend
            "human_name": self.human_name,
            "is_drilldown": self.is_drilldown,
            "name": self.name,
            "values": [
                # Aggregate the information from right above to build the values
                {"count": count, "human_name": key_i18n_name_map[key], "key": key}
                for key, count in key_count_map.items()
            ],
        }


class FilterDefinitionLanguages(FilterDefinitionTerms):
    """
    Languages need their own FilterDefinition subclass as there's a different way to get their
    human names from other terms-based filters
    """

    def get_i18n_names(self, keys, language):
        """
        All possible language keys should be in the ALL_LANGUAGES_DICT. We can just return it
        and let `get_faceted_definition` pick what it needs
        """
        return settings.ALL_LANGUAGES_DICT
