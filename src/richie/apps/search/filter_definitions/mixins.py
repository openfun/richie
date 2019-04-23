"""Define mixins to easily compose custom FilterDefinition classes."""
import re


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


class TermsAggsMixin:
    """A mixin for filter definitions that need to apply aggregations as term queries."""

    @property
    def aggs_include(self):
        """
        Return a regex to limit the terms on which the field will be faceted. We return ".*" by
        default (no limitation) but it can be overriden in children classes.
        """
        return ".*"

    # pylint: disable=unused-argument
    def get_aggs_fragment(self, queries, data, *args, **kwargs):
        """
        Build the aggregations as a term query that counts all the different values assigned
        to the field.
        """
        # Look for an include parameter in the form data and default to the regex returned
        # by the `aggs_include` property:
        include = data[f"{self.name:s}_include"] or self.aggs_include

        # Use all the query fragments from the queries *but* the one(s) that filter on the
        # current filter
        filter_fragments = [
            clause
            for kf_pair in queries
            for clause in kf_pair["fragment"]
            if kf_pair["key"] is not self.name
        ]

        # Terms aggregation will return the n top facet counts among all the values taken
        # by this field
        terms_aggs = {
            self.name: {
                # Rely on the built-in "terms" aggregation to get everything we need
                "aggregations": {
                    self.name: {
                        "terms": {
                            "field": self.term,
                            "include": include,
                            "min_doc_count": self.min_doc_count,
                        }
                    }
                },
                # Use all the query fragments from the queries *but* the one(s) that
                # filter on the current filter, as it is handled by ElasticSearch for us
                "filter": {"bool": {"must": filter_fragments}},
            }
        }

        # Filters aggregation for values that were selected in the querystring (we must force
        # them because they may not be in the n top facet counts but we must make sure we keep
        # them so that they remain available as options that the user can see and unselect)
        terms_aggs.update(
            {
                # Create a custom aggregation for each value selected in the querystring
                # and matching the include regex
                # eg `organizations@P-0001` & `organizations@P-0002`
                "{:s}@{:s}".format(self.name, value): {
                    "filter": {
                        "bool": {
                            # Use all the query fragments from the queries *but* the one(s) that
                            # filter on the current filter: we manually add back the only one that
                            # is relevant to the current choice.
                            "must": [{"term": {self.term: value}}]
                            + filter_fragments
                        }
                    }
                }
                for value in data.get(self.name, [])
                # The Elasticsearch include regex matches exact values so we must do the same
                # by adding ^ (resp. $) at the beginning (resp. at the end) of the pattern.
                if re.match(f"^{include:s}$", value)
            }
        )

        return terms_aggs


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
            "{:s}@{:s}".format(self.name, choice_key): {
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
            "{:s}@{:s}".format(self.name, choice_key): {
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
