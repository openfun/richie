"""
Base backend to connect richie with an LMS
"""


class BaseLMSBackend:
    """
    Base backend to hold the methods common to all backends and provide a skeleton for others.
    """

    def __init__(self, configuration, *args, **kwargs):
        """Attache configuration to the backend instance."""
        super().__init__(*args, **kwargs)
        self.configuration = configuration
