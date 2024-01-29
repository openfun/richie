"""
Backend to connect Open edX richie with an LMS
"""

import logging
import re

import requests
from requests.auth import AuthBase

from .base import BaseLMSBackend

logger = logging.getLogger(__name__)

VISIBILITY_MAPPING = {
    "both": "course_and_search",
    "about": "course_only",
    "none": "hidden",
}


def split_course_key(key):
    """Split an OpenEdX course key by organization, course and course run codes.

    We first try splitting the key as a version 1 key (course-v1:org+course+run)
    and fallback the old version (org/course/run).
    """
    if key.startswith("course-v1:"):
        organization, course, run = key[10:].split("+")
    else:
        organization, course, run = key.split("/")

    return organization, course, run


class EdXTokenAuth(AuthBase):
    """Attach HTTP token authentication to the given Request object."""

    def __init__(self, token):
        """Set up token value in the instance."""
        self.token = token

    def __call__(self, request):
        """Modify and return the request."""
        request.headers.update(
            {"X-Edx-Api-Key": self.token, "Content-Type": "application/json"}
        )
        return request


class TokenAPIClient(requests.Session):
    """
    A :class:`requests.Session` that automatically authenticates against edX's preferred
    authentication method up to Dogwood, given a secret token.

    For more usage details, see documentation of the :class:`requests.Session` object:
    https://requests.readthedocs.io/en/master/user/advanced/#session-objects
    """

    def __init__(self, token, *args, **kwargs):
        """Extending the session object by setting the authentication token."""
        super().__init__(*args, **kwargs)
        self.auth = EdXTokenAuth(token)


class EdXLMSBackend(BaseLMSBackend):
    """LMS backend for Richie tested with Open EdX Dogwood to Hawthorn."""

    @property
    def api_client(self):
        """Instantiate and return an edx token API client."""
        return TokenAPIClient(self.configuration["API_TOKEN"])

    def extract_course_id(self, url):
        """Extract the LMS course id from the course run url."""
        return re.match(self.configuration["COURSE_REGEX"], url).group("course_id")

    def extract_course_code(self, data):
        """Extract the LMS course code from data dictionary."""
        course_id = self.extract_course_id(data.get("resource_link"))
        return split_course_key(course_id)[1]

    def clean_course_run_data(self, data):
        """Try mapping OpenEdX visibility values to Richie's corresponding values."""
        try:
            data["catalog_visibility"] = VISIBILITY_MAPPING[data["catalog_visibility"]]
        except KeyError:
            pass
        return data
