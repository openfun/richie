"""
Common utilities related to our indexers. For use in our indexers and related settings,
or as helpers for users of the project.
"""
from django.utils.module_loading import import_string


class IndicesList:
    """
    This utility class allow configuring indexers from the settings and still benefit from
    an easy access and handling of the instantiated indexers. For example:

        >>> indices = IndicesList(
        ...     "courses": "richie.apps.search.indexers.courses.CoursesIndexer",
        ...     "categories": "richie.apps.search.indexers.categories.CategoriesIndexer",
        ... )
        >>> courses_indexer = indices.courses
        >>> for indexer in indexers:
        ...     form = indexer.form()....
    """

    def __init__(self, **kwargs):
        """Record any dotted path to indices to allow access by property or iteration."""
        self.index_map = kwargs

    def __getattr__(self, item):
        """Allow accessing indices via properties (e.g. indices.courses)."""
        return import_string(self.index_map[item])

    def __iter__(self):
        """Allow iterating through indices (e.g. for index in indices)."""
        return iter(
            [import_string(dotted_path) for dotted_path in self.index_map.values()]
        )


def slice_string_for_completion(string):
    """
    Split a string in significant parts for use in completion.
    Example: "University of Paris 13" => "University of Paris 13", "of Paris 13", "Paris 13", "13"

    This is useful to enable autocompletion starting from any part of a name. If we just use the
    name directly in the ES completion type, it will only return options that match on the first
    characters of the whole string, which is not always suitable.
    """
    parts = [part for part in string.split(" ") if part != ""]
    return [" ".join(parts[index:]) for index, _ in enumerate(parts)]
