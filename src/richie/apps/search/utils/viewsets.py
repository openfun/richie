"""
Helpers to enable reuse for needs that are shared between viewsets.
"""


class ViewSetMetadata:
    """
    "Meta" class intended to be used as an attribute on ViewSets to provide a common set of
    meta attributes, like the Django `class Meta` on eg. models.
    """

    def __init__(self, indexer):
        """
        Set the required attributes passed from the call site. Currently this only includes
        the ViewSet's corresponding indexer.
        """
        self.indexer = indexer
