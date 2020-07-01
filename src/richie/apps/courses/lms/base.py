"""
Base backend to connect richie with an LMS
"""
import re


class BaseLMSBackend:
    """
    Base backend to hold the methods common to all backends and provide a skeleton for others.
    """

    def __init__(self, configuration, *args, **kwargs):
        """Attache configuration to the backend instance."""
        super().__init__(*args, **kwargs)
        self.configuration = configuration

    def extract_course_id(self, url):
        """Extract the LMS course id from the course run url."""
        return re.match(self.configuration["COURSE_REGEX"], url).group("course_id")
