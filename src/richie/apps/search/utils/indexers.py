"""
Common utilities related to our indexers. For use in our indexers and related settings,
or as helpers for users of the project.
"""
from collections import namedtuple

# Define a named tuple type that will enforce the necessary keys for our ES_INDICES setting
# (and also make iteration, both with and without keys, trivial)
IndicesList = namedtuple("IndicesList", ["courses", "organizations", "categories"])


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
