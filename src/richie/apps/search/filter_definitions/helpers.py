"""Common helpers for different kinds of filter definitions."""

from ..defaults import FACET_COUNTS_DEFAULT_LIMIT, FACET_COUNTS_MAX_LIMIT


def applicable_facet_limit(data, filter_name):
    """
    Detect the applicable facet counts limit for a given filter depending on the request params.
    It should be `FACET_COUNTS_DEFAULT_LIMIT` — which is intended to keep a clean UI on the search
    engine — unless the request is for a specific subset of values, in which case we increase the
    limit to `FACET_COUNTS_MAX_LIMIT` — which exists to provide a sensible upper boundary.
    """
    try:
        has_self_include = data[f"{filter_name:s}_aggs"]
        return (
            FACET_COUNTS_MAX_LIMIT if has_self_include else FACET_COUNTS_DEFAULT_LIMIT
        )
    except KeyError:
        return FACET_COUNTS_DEFAULT_LIMIT
