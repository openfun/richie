"""
Common utilities related to our indexers. For use in our indexers and related settings,
or as helpers for users of the project.
"""

from django.utils.module_loading import import_string

from ...courses.defaults import DAY, HOUR, MINUTE, MONTH, WEEK


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


def get_course_pace(effort=None, duration=None):
    """
    Generate a single number for course pace, based on the effort and duration of the course.
    Standardize on minutes/week:
    - per week is the reference unit that makes the most sense for a course;
    - minutes let us make the pace field an integer field, easy to convert to hours for
      user facing strings.
    """
    # Courses without a duration are self-paced and do not have a pace
    if not effort or not duration:
        return None

    # Normalize all efforts to minutes
    if effort[1] == MINUTE:
        effort_in_minutes = effort[0]
    elif effort[1] == HOUR:
        effort_in_minutes = effort[0] * 60
    else:
        return None

    # Normalize all paces to minutes per week
    if duration[1] == DAY:
        return round(effort_in_minutes / duration[0] * 7)
    if duration[1] == WEEK:
        return round(effort_in_minutes / duration[0])
    if duration[1] == MONTH:
        return round(effort_in_minutes / duration[0] / 4.345)
    # Drop courses with reference units in minutes and hours at they make no sense
    # to express a course pace
    return None
