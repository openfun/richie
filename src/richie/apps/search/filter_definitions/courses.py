"""Define FilterDefinition classes for the courses index."""
from functools import reduce

from django import forms
from django.utils import timezone, translation
from django.utils.translation import gettext as _

from cms.api import Page

from richie.apps.core.defaults import ALL_LANGUAGES_DICT

from .. import ES_CLIENT
from ..fields.array import ArrayField
from ..indexers import ES_INDICES
from ..utils.i18n import get_best_field_language
from .base import BaseChoicesFilterDefinition, BaseFilterDefinition
from .mixins import (
    ChoicesAggsMixin,
    ChoicesQueryMixin,
    NestedChoicesAggsMixin,
    TermsAggsMixin,
    TermsQueryMixin,
)


class IndexableFilterDefinition(TermsAggsMixin, TermsQueryMixin, BaseFilterDefinition):
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
                else:
                    self._base_page = page

            return self._base_page

        return None

    @property
    def aggs_include(self):
        """
        Return a regex that limits what facets are computed on the field.

        Returns:
        --------
            string: a regex depending on filters configuration in settings and pages in the CMS:
            - "": the empty string, if the `reverse_id` does not correspond to any published
                page which will not match any value and return an empty list of facets,
            - ".*-0001.{4}": if the `reverse_id` points to a published page with path "0001"
                this will match ids of the children of this page that will be of the form
                P-00010001 if they have children or L-00010001 if they are leafs,
            ' ".*": if no `reverse_id` is set (delegated to super) which will
                match all values.
        """
        if self.reverse_id:
            if self.base_page:
                node = self.base_page.node
                return f".*-{node.path:s}.{{{node.steplen:d}}}"
            return ""

        return super().aggs_include

    def get_form_fields(self):
        """
        Indexables are filtered via:
        - a list of their Elasticsearch ids i.e strings,
        - a regex to eventually limit which terms are facetted.
        """
        return {
            self.name: (
                ArrayField(required=False, base_type=forms.CharField(max_length=50)),
                True,  # an ArrayField expects list values
            ),
            f"{self.name:s}_include": (
                forms.CharField(max_length=20, required=False),
                False,  # a CharField expects string values
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

        # Extract the best available language here to avoid handling these kinds of
        # implementation details in the ViewSet
        return {
            doc["_id"]: get_best_field_language(doc["_source"]["title"], language)
            for doc in search_query_response["hits"]["hits"]
        }

    def get_faceted_definitions(self, facets, *args, **kwargs):
        """
        Build the filter definition's values from base definition and the faceted keys in the
        current language.
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
        #   {"A": x, "B": y, "C": z}
        key_count_map = reduce(
            lambda agg, key_count_dict: {
                **agg,
                key_count_dict["key"]: key_count_dict["doc_count"],
            },
            facets[self.name][self.name]["buckets"],
            {},
        )

        # Add the facets that were forced because their value was selected in querystring
        # Their result is of the form: {'organizations@P-0001': {'doc_count': 12}}
        key_count_map.update(
            {
                key.split("@")[1]: facet["doc_count"]
                for key, facet in facets.items()
                if "{:s}@".format(self.name) in key  # 6 times faster than startswith
            }
        )

        # Get internationalized names for all our keys
        key_i18n_name_map = self.get_i18n_names([key for key in key_count_map])

        return {
            self.name: {
                # We always need to pass the base definition to the frontend
                "human_name": self.human_name,
                "is_drilldown": self.is_drilldown,
                "name": self.name,
                "base_path": self.base_page.node.path if self.base_page else None,
                "position": self.position,
                "values": [
                    # Aggregate the information from right above to build the values
                    {"count": count, "human_name": key_i18n_name_map[key], "key": key}
                    for key, count in key_count_map.items()
                ],
            }
        }


class StaticChoicesFilterDefinition(
    ChoicesAggsMixin, ChoicesQueryMixin, BaseChoicesFilterDefinition
):
    """
    A filter definition for static choices ie that can be defined from the project settings.
    """

    def __init__(self, values, fragment_map, *args, **kwargs):
        """Record values and fragment map as attributes."""
        super().__init__(*args, **kwargs)
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
        return {
            self.OPEN: [
                {"range": {"course_runs.enrollment_start": {"lte": timezone.now()}}},
                {"range": {"course_runs.enrollment_end": {"gte": timezone.now()}}},
            ],
            self.COMING_SOON: [
                {"range": {"course_runs.start": {"gte": timezone.now()}}}
            ],
            self.ONGOING: [
                {"range": {"course_runs.start": {"lte": timezone.now()}}},
                {"range": {"course_runs.end": {"gte": timezone.now()}}},
            ],
            self.ARCHIVED: [{"range": {"course_runs.end": {"lte": timezone.now()}}}],
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
