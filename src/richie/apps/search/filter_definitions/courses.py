"""Define FilterDefinition classes for the courses index."""

import re
from operator import itemgetter

from django import forms
from django.core.cache import caches
from django.core.cache.backends.base import InvalidCacheBackendError
from django.core.exceptions import ImproperlyConfigured
from django.utils import translation
from django.utils.translation import gettext as _

import arrow
from cms.api import Page

from richie.apps.core.defaults import ALL_LANGUAGES_DICT

from .. import ES_CLIENT
from ..fields.array import ArrayField
from ..indexers import ES_INDICES
from ..utils.i18n import get_best_field_language
from .base import BaseChoicesFilterDefinition, BaseFilterDefinition
from .helpers import applicable_facet_limit
from .mixins import (
    ChoicesAggsMixin,
    ChoicesQueryMixin,
    NestedChoicesAggsMixin,
    TermsQueryMixin,
)


class IndexableFilterDefinition(TermsQueryMixin, BaseFilterDefinition):
    """
    Filter definition for a terms-based filter. The choices are generated dynamically from
    the incoming facets to avoid having to hold in memory or iterate over an unbounded
    number of choices.
    """

    def __init__(self, name, reverse_id=None, **kwargs):
        self.reverse_id = reverse_id
        self._base_page = None
        super().__init__(name, **kwargs)

    @property
    def base_page(self):
        """
        Returns the base page under which the indexable pages target by this filter are placed
        in the CMS.

        The page is cached the first time it is requested and remains in cache as long as the
        application is running.
        """
        if self.reverse_id:
            if self._base_page is None:
                try:
                    page = Page.objects.select_related("node").get(
                        publisher_is_draft=False, reverse_id=self.reverse_id
                    )
                except Page.DoesNotExist:
                    return None

                self._base_page = page

            return self._base_page

        return None

    @property
    def aggs_include(self):
        """Do not limit which facets are computed by default."""
        return ".*"

    # pylint: disable=unused-argument,arguments-differ
    def get_aggs_fragment(self, queries, data, *args, **kwargs):
        """
        Build the aggregations as a term query that counts all the different values assigned
        to the field.
        """
        # Look the aggregations parameters in the form data (either [filter]_children_aggs or
        # [filter]_aggs), and default to the filter definition's aggs_include.
        if data[f"{self.name:s}_children_aggs"]:
            # Cache the request for children of the relevant parent
            parent_id = data[f"{self.name:s}_children_aggs"]
            cache_key = f"filter_definition_{self.name}_aggs_include_{parent_id}"
            try:
                cache = caches["search"]
                include = cache.get(cache_key)
            except InvalidCacheBackendError:
                cache = None
                include = None

            if include is None:
                # Add all child pages of the given parent to the included aggs
                include = [
                    str(page_id)
                    for page_id in Page.objects.get(id=parent_id)
                    .get_child_pages()
                    .values_list("id", flat=True)
                ]
                if cache is not None:
                    cache.set(cache_key, include)

        else:
            include = data[f"{self.name:s}_aggs"] or self.aggs_include

        # Use all the query fragments from the queries *but* the one(s) that filter on the
        # current filter
        filter_fragments = [
            clause
            for kf_pair in queries
            for clause in kf_pair["fragment"]
            if kf_pair["key"] is not self.name
        ]

        # Detect the applicable facet counts limit depending on the request
        base_facet_limit = applicable_facet_limit(data, self.name)

        # Add a control length to let us know if there are more items than what what we're
        # returning. This is achieved by counting the results in `get_facet_info``.
        # Example:
        #   - applicable limit is 10;
        #   - 2 active filters;
        #   - query the top 13 (10 + 2 + 1) facets;
        #   => we'll be able to determine if there are more items depending on what is returned
        #      and how they are ordered. (see in `get_facet_info`).
        control_length = len(data[self.name]) + 1

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
                            # Always force `min_doc_count` at 0: we filter the results in
                            # `get_facet_info` so we can have more information on the
                            # availability of more values below the filter's `min_doc_count`.
                            "min_doc_count": 0,
                            "size": base_facet_limit + control_length,
                        }
                    }
                },
                # Use all the query fragments from the queries *but* the one(s) that
                # filter on the current filter, as it is handled by ElasticSearch for us
                "filter": {"bool": {"must": filter_fragments}},
            }
        }

        def value_included(value, include):
            """
            Do not build aggregations for values from query string if they do not match
            the current include filter.
            Use a function to perform the check as the include filter can be either a regex
            or a list.
            """
            try:
                # The Elasticsearch include regex matches exact values so we must do the same
                # by adding ^ (resp. $) at the beginning (resp. at the end) of the pattern.
                return re.match(f"^{include:s}$", value)
            # Trying to build the regex with a list will trigger a TypeError
            except TypeError:
                return value in include

        # Filters aggregation for values that were selected in the querystring (we must force
        # them because they may not be in the n top facet counts but we must make sure we keep
        # them so that they remain available as options that the user can see and unselect)
        terms_aggs.update(
            {
                # Create a custom aggregation for each value selected in the querystring
                # and matching the include regex
                # eg `organizations@P-0001` & `organizations@P-0002`
                f"{self.name:s}@{value:s}": {
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
                if value_included(value, include)
            }
        )

        return terms_aggs

    def get_form_fields(self):
        """
        Indexables are filtered via:
        - a list of their Elasticsearch ids i.e strings,
        - a list of ES IDs for which we want to get aggregations,
        - one filter whose children we want to use for aggregations.
        """
        return {
            self.name: (
                ArrayField(required=False, base_type=forms.CharField(max_length=50)),
                True,  # an ArrayField expects list values
            ),
            f"{self.name}_aggs": (
                ArrayField(required=False, base_type=forms.CharField(max_length=50)),
                True,  # an ArrayField expects list values
            ),
            f"{self.name}_children_aggs": (
                forms.CharField(required=False, max_length=50),
                False,
            ),
        }

    def get_i18n_names(self, keys):
        """
        Helper method to get the corresponding internationalized human name for each key in
        a list of indexed objects' ids.
        This covers the base case for terms e.g. other models in their own ElasticSearch index
        like organizations or categories.
        """
        language = translation.get_language()
        indexer = getattr(ES_INDICES, self.term)

        # Get just the documents we need from ElasticSearch
        # pylint: disable=unexpected-keyword-arg
        search_query_response = ES_CLIENT.search(
            # We only need the titles to get the i18n names
            _source=["title"],
            index=indexer.index_name,
            body={"query": {"terms": {"_id": keys}}},
            size=len(keys),
        )

        # Extract the best available language here to avoid handling these kinds of
        # implementation details in the ViewSet
        return {
            doc["_id"]: get_best_field_language(doc["_source"]["title"], language)
            for doc in search_query_response["hits"]["hits"]
        }

    def get_facet_info(self, facets, data, *args, **kwargs):
        """
        Build the facet information from keys in the current language.
        Those provide us with the keys and counts that we just have to consume. They come from:
        - a bucket with the top facets in decreasing order of counts,
        - specific facets for values that were select in the querystring (we must force them
          because they may not be in the n top facet counts but we must make sure we keep it
          so that it remains available as an option so the user sees it and can unselect it)

        We resort to the `get_i18n_names` method to get the internationalized human names.
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
        #   [
        #       ("A", x),
        #       ("B", y),
        #       ("C", z),
        #   ]
        # sorted from highest facet count to lowest.
        key_count_pairs = sorted(
            [
                (key_count_dict["key"], key_count_dict["doc_count"])
                for key_count_dict in facets[self.name][self.name]["buckets"]
            ],
            key=itemgetter(1),
            reverse=True,
        )

        # We requested more facets than needed to be able to determine with certainty if there
        # are more available than what we're returning (see in `get_aggs_fragment`).
        base_facet_limit = applicable_facet_limit(data, self.name)
        # There are four possible outcomes:
        #   - We have as many results as we requested: there are more values (at least the `+1` we
        #     added to our request besides the base limit and the active values);
        #   - We have no value(s) besides the base limit: we can safely conclude there are no more
        #     values (eg. we did not get that requested `+1`)
        #   - We are somewhere between one more than the base limit and the requested number: this
        #     is ambiguous because it depends on the placement of our active values (which are
        #     always included no matter the circumstances).
        #       => If at least one of the values beyond base limit is not an active value, we know
        #          we're not going to show it. Therefore there are more values.
        #       => Otherwise, meaning if all the values beyond the base limit happen to be our
        #          active values, we are going to show all of them and therefore there is nothing
        #          more to request.
        has_more_values = any(
            filter(
                lambda c: c[0] not in data[self.name],
                key_count_pairs[base_facet_limit:],
            )
        )

        # Now that we've used our extra values to determine if there are more values to be fetched,
        # we can trim our counts down to the top N, based on the applicable limit.
        key_count_map = dict(key_count_pairs[:base_facet_limit])

        # Add the facets that were forced because their value was selected in querystring
        # Their result is of the form: {'organizations@P-0001': {'doc_count': 12}}
        key_count_map.update(
            {
                key.split("@")[1]: facet["doc_count"]
                for key, facet in facets.items()
                if f"{self.name:s}@" in key  # 6 times faster than startswith
            }
        )

        # Get internationalized names for all our keys
        key_i18n_name_map = self.get_i18n_names([*key_count_map])

        # Add human names to keys and counts before sorting as some of our sortings
        # use alphabetical ordering.
        values = [
            # Aggregate the information from right above to build the values
            {
                "count": count,
                "human_name": key_i18n_name_map[key],
                "key": key,
            }
            for key, count in key_count_map.items()
        ]

        sorting = data["facet_sorting"] or self.sorting
        # Sort facets as requested
        if sorting == self.SORTING_NAME:
            # Alphabetical ascending sorting
            values = sorted(
                values,
                key=lambda value: (value["human_name"], value["count"] * -1),
            )
        elif sorting == self.SORTING_COUNT:
            # Sorting by descending facet count
            values = sorted(
                values,
                key=lambda value: (value["count"] * -1, value["human_name"]),
            )
        else:
            # NB: self.SORTING_CONF is not appropriate for Indexables as they are not defined
            # in the static filter definition but generated from indices.
            raise ImproperlyConfigured(
                f'Facet sorting "{sorting}" is invalid for filter {self.name}.'
            )

        return {
            self.name: {
                # If values are removed due to `min_doc_count`, we are not returning them, and
                # therefore by definition our filter `has_more_values`.
                "has_more_values": has_more_values
                or any(value["count"] < self.min_doc_count for value in values),
                "values": list(
                    filter(
                        # We filter out values that do not meet `min_doc_count`manually instead of
                        # using ElasticSearch's builtin feature so it does not interfere with our
                        # `has_more_values` check.
                        lambda value: value["count"] >= self.min_doc_count
                        or value["key"] in data[self.name],
                        values,
                    )
                ),
            }
        }


class IndexableHierarchicalFilterDefinition(IndexableFilterDefinition):
    """
    Some of our filters are a special case of terms-based filter as they use MPTT paths
    as IDs and enable limiting faceting by path.
    """

    @property
    def aggs_include(self):
        """
        Return a list that limits what facets are computed on the field.

        Returns:
        --------
            list: a list depending on filters configuration in settings and pages in the CMS:
            - an empty list, if the `reverse_id` does not correspond to any published
                page which will not match any value and return an empty list of facets,
            - a list of ids of all direct children of the base page,
            - ".*": if no `reverse_id` is set (delegated to super) which will match all values.
        """
        if self.reverse_id:
            if self.base_page:
                cache_key = f"filter_definition_{self.name}_aggs_include"
                try:
                    cache = caches["search"]
                    aggs_include = cache.get(cache_key)
                except InvalidCacheBackendError:
                    cache = None
                    aggs_include = None

                if aggs_include is None:
                    # Add all the direct children of the base page to the included aggregations
                    aggs_include = [
                        str(page_id)
                        for page_id in self.base_page.get_child_pages().values_list(
                            "id", flat=True
                        )
                    ]
                    if cache is not None:
                        cache.set(cache_key, aggs_include)

                return aggs_include
            return []

        return super().aggs_include


class StaticChoicesFilterDefinition(
    ChoicesAggsMixin, ChoicesQueryMixin, BaseChoicesFilterDefinition
):
    """
    A filter definition for static choices ie that can be defined from the project settings.
    """

    def __init__(self, name, values, fragment_map, *args, **kwargs):
        """Record values and fragment map as attributes."""
        super().__init__(name, *args, **kwargs)
        self.values = values
        self.fragment_map = fragment_map

    def get_values(self):
        """Return the values recorded as attribute."""
        return self.values

    def get_fragment_map(self):
        """Return the fragment map recorded as attribute."""
        return self.fragment_map


class AvailabilityFilterDefinition(
    NestedChoicesAggsMixin, ChoicesQueryMixin, BaseChoicesFilterDefinition
):
    """
    Filter definition to allow filtering by availability. Hardcoded choices provided along with
    their Elasticsearch filtering fragment.
    """

    COMING_SOON, OPEN, ONGOING, ARCHIVED = "coming_soon", "open", "ongoing", "archived"

    def get_values(self):
        """Return the hardcoded values with internationalized human names."""
        return {
            self.OPEN: _("Open for enrollment"),
            self.COMING_SOON: _("Coming soon"),
            self.ONGOING: _("On-going"),
            self.ARCHIVED: _("Archived"),
        }

    def get_fragment_map(self):
        """Return the hardcoded query fragments updated to the current datetime."""
        now = arrow.utcnow().datetime
        return {
            self.OPEN: [
                {"range": {"course_runs.enrollment_start": {"lte": now}}},
                {"range": {"course_runs.enrollment_end": {"gte": now}}},
            ],
            self.COMING_SOON: [{"range": {"course_runs.start": {"gte": now}}}],
            self.ONGOING: [
                {"range": {"course_runs.start": {"lte": now}}},
                {"range": {"course_runs.end": {"gte": now}}},
            ],
            self.ARCHIVED: [{"range": {"course_runs.end": {"lte": now}}}],
        }


class LanguagesFilterDefinition(
    NestedChoicesAggsMixin, TermsQueryMixin, BaseChoicesFilterDefinition
):
    """
    Languages need their own FilterDefinition subclass as there's a different way to get their
    human names from other terms-based filters and the filter is applied on the `course_runs`
    nested field.
    """

    def get_values(self):
        """Return the language values defined in the project's settings."""
        return ALL_LANGUAGES_DICT

    def get_fragment_map(self):
        """Compute query fragments for each language defined in the project's settings."""
        return {
            language: [{"term": {"course_runs.languages": language}}]
            for language in ALL_LANGUAGES_DICT
        }
