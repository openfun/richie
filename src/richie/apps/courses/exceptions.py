"""
Specific exceptions for the courses app
"""


class MissingResourceLinkError(Exception):
    """
    Exception raised when a course run data dictionary is missing a resource link.
    """
