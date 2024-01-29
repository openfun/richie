"""
Backend to connect Richie with Joanie
"""

import re

from .base import BaseLMSBackend


class JoanieBackend(BaseLMSBackend):
    """Joanie backend for Richie"""

    is_joanie = True

    @staticmethod
    def extract_course_code(data):
        """Extract the LMS course code from data dictionary."""
        return data.get("course")

    def _extract_info(self, content, capturing_group):
        """
        Try to extract a matched capturing group from a provided content.
        """
        return re.match(self.configuration["COURSE_REGEX"], content).group(
            capturing_group
        )

    def extract_resource_type(self, resource_link):
        """
        Try to extract the resource type (products or course runs)
        from the provided resource_link.
        """
        return self._extract_info(resource_link, "resource_type")

    def extract_resource_id(self, resource_link):
        """
        Try to extract the resource id (products or course runs)
        from the provided resource_link.
        """
        return self._extract_info(resource_link, "resource_id")
