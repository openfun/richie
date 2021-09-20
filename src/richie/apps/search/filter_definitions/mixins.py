"""Define mixins to easily compose custom FilterDefinition classes."""


class TermsQueryMixin:
    """A mixin for filter definitions that need to apply term queries."""

    def get_query_fragment(self, data):
        """Build the query fragments as term queries for each selected value."""
        value_list = data.get(self.name)

        # For terms filters, as the name implies, it's a simple terms fragment
        return (
            [{"key": self.name, "fragment": [{"terms": {self.term: value_list}}]}]
            if value_list
            else []
        )


class ChoicesQueryMixin:
    """A mixin for filter definitions that need to apply predefined queries."""

    def get_query_fragment(self, data):
        """Pick the hardcoded query fragment for each selected value."""
        fragment_map = self.get_fragment_map()
        return [
            {"key": self.name, "fragment": fragment_map[value]}
            for value in data.get(self.name, [])
        ]


class ChoicesAggsMixin:
    """A mixin for filter definitions that need to apply aggregations for predefined choices."""

    # pylint: disable=unused-argument
    def get_aggs_fragment(self, queries, *args, **kwargs):
        """
        Build the aggregations as a set of filters, one for each possible value of the field.
        """
        return {
            # Create a custom aggregation for each possible choice for this filter
            # eg `availability@coming_soon` & `availability@current` & `availability@open`
            f"{self.name:s}@{choice_key:s}": {
                "filter": {
                    "bool": {
                        # Use all the query fragments from the queries *but* the one(s) that
                        # filter on the current filter: we manually add back the only one that
                        # is relevant to the current choice.
                        "must": choice_fragment
                        + [
                            clause
                            for kf_pair in queries
                            for clause in kf_pair["fragment"]
                            if kf_pair["key"] is not self.name
                        ]
                    }
                }
            }
            for choice_key, choice_fragment in self.get_fragment_map().items()
        }


class NestedChoicesAggsMixin:
    """
    A mixin for filter definitions that are related to a nested field. The aggregation filter can
    only be recomputed at the level of the parent because it should group all queries of fields
    nested below the parent.
    """

    # pylint: disable=unused-argument
    def get_aggs_fragment(self, queries, data, parent, *args, **kwargs):
        """
        Computing aggregations for a nested field is DIFFICULT because query fragments related to
        nested fields are grouped under their common path. For example combined filters on
        availability and languages would lead to a query like:
            {
                "query": {
                    "nested": {
                        "path": "course_runs",
                        "query": {
                            "bool": {
                                "must": [
                                    {"range": {"course_runs.end": {"lte": "01-01-2019"}}},
                                    {"terms": {"course_runs.languages": ["de", "en", fr"]}},
                                ]
                            }
                        },
                    }
                }
            }
        In this example, computing the facet count for the French filter, is done with the
        following filter (excluding the filter on English and German so we only count French):
            {
                "query": {
                    "nested": {
                        "path": "course_runs",
                        "query": {
                            "bool": {
                                "must": [
                                    {"range": {"course_runs.end": {"lte": "01-01-2019"}}},
                                    {"terms": {"course_runs.languages": ["fr"]}},
                                ]
                            }
                        },
                    }
                }
            }

        This can only be built by calling the parent NestingWrapper with customized filter data.
        """
        return {
            # Create a custom aggregation for each possible choice for this filter
            # eg `availability@coming_soon` & `availability@current` & `availability@open`
            f"{self.name:s}@{choice_key:s}": {
                "filter": {
                    "bool": {
                        # Use all the query fragments from the queries (the nesting parent is
                        # responsible for excluding the queries related to nested fields so we
                        # have to manually add them, making sure to apply on the current field
                        # only the current choice.
                        "must": [
                            clause
                            for kf_pair in (
                                queries
                                + parent.get_query_fragment(
                                    # override data with only the current choice
                                    {**data, self.name: [choice_key]}
                                )
                            )
                            for clause in kf_pair["fragment"]
                        ]
                    }
                }
            }
            for choice_key, choice_fragment in self.get_fragment_map().items()
        }
