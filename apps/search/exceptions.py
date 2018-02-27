"""
Specific exceptions for the search app
"""


class IndexerDataException(Exception):
    """
    Exception raised when an Indexer fails to provide the data required for ES indexing
    """
