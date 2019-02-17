"""
Define our default FilterDefinition classes.
They encapsulate common behavior around managing filters in ElasticSearch queries and
API requests (to validate input) and responses (to produce easy-to-consume filters).
"""


class FilterDefinitionBase:
    """
    Base filter definition shape: just an init method to set common attributes.
    """

    def __init__(self, name, human_name):
        """
        Assign the common attributes.
        """
        self.name = name
        self.human_name = human_name


class FilterDefinitionCustom(FilterDefinitionBase):
    """
    Filter definition for a custom filter with hardcoded choices provided along with their
    ES filtering fragment.
    """

    def __init__(self, name, human_name, choices):
        """
        Extend the base filter definition with key/fragment map to easily generate the
        query & aggregation fragments for choices.
        """
        super().__init__(name, human_name)
        # The key/fragment map is static and helpful to get query & aggregations fragments
        self._key_fragment_map = {choice[0]: choice[2] for choice in choices}

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


class FilterDefinitionTerms(FilterDefinitionBase):
    """
    Filter definition for a terms-based filter. The choices will be generated dynamically from
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
