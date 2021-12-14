"""
Backend to connect Open edX richie with an LMS
"""
import logging
import re

import requests
from requests.auth import AuthBase

from ..serializers import SyncCourseRunSerializer
from .base import BaseLMSBackend

logger = logging.getLogger(__name__)


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
        """Set-up token value in the instance."""
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

    def extract_course_number(self, data):
        """Extract the LMS course number from data dictionary."""
        course_id = self.extract_course_id(data.get("resource_link"))
        return split_course_key(course_id)[1]

    def clean_course_run_data(self, data):
        """Remove course run's protected fields to the data dictionnary."""

        def filter_no_update_fields(elem):
            """
            Remove course run's protected fields from the `COURSE_RUN_SYNC_NO_UPDATE_FIELDS`
            setting
            """
            return elem[0] not in self.configuration.get(
                "COURSE_RUN_SYNC_NO_UPDATE_FIELDS", []
            )

        def change_catalog_visibility_value(value):
            """Adapt catalog visibility values from Open edX to Richie"""
            if value == "both":
                return "course_and_search"
            if value == "about":
                return "course_only"
            if value == "none":
                return "hidden"
            return value

        def adapt_fields(item):
            """
            Adapt a dict item (key/value). If it's the `catalog_visibility` then change
            its value.
            """
            key = item[0]
            value = item[1]
            if key == "catalog_visibility":
                return key, change_catalog_visibility_value(value)
            return key, value

        return dict(map(adapt_fields, filter(filter_no_update_fields, data.items())))

    @staticmethod
    def get_course_run_serializer(data, partial=False):
        """Prepare data and return a bound serializer."""
        return SyncCourseRunSerializer(data=data, partial=partial)
