"""
Specific exceptions for the search app
"""


class ApiConsumingException(Exception):
    """
    Exception raised when an exception occurs during API walk using our api_consumption util
    """


class IndexerDataException(Exception):
    """
    Exception raised when an Indexer fails to provide the data required for ES indexing
    """


class QueryFormatException(Exception):
    """
    Exception raised when the query parameters for a GET list call are invalid
    """
