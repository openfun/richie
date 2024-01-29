"""LMS handler to select and return the right LMS backend for each url."""

import re

from django.conf import settings
from django.utils.module_loading import import_string


class LMSHandler:
    """Class to handle LMS backends.

    Actions on a particular course are automatically routed to the LMS handling this course
    via the `COURSE_REGEX` configured for each LMS.
    """

    @staticmethod
    def get_lms_classes():
        """
        Return all enabled LMS classes.
        """

        return {
            import_string(lms_configuration["BACKEND"])
            for lms_configuration in settings.RICHIE_LMS_BACKENDS
        }

    @staticmethod
    def select_lms(url):
        """
        Select and return the first LMS backend matching the url passed in argument.

        Default to None if no LMS is found to enable use-cases where we need to detect whether
        a course run has a matching LMS or not. Callers can determine if not finding an LMS
        backend is an exception or not.
        """
        if url is None:
            return None

        # First check if it matches a configured LMS
        for lms_configuration in settings.RICHIE_LMS_BACKENDS:
            if re.match(lms_configuration.get("COURSE_REGEX", r".*"), url):
                return import_string(lms_configuration["BACKEND"])(lms_configuration)

        return None
