"""
Backend to connect Open edX richie with an LMS
"""
import json
import logging

import requests
from requests.auth import AuthBase

from .base import BaseLMSBackend

logger = logging.getLogger(__name__)


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


class TokenEdXLMSBackend(BaseLMSBackend):
    """LMS backend for Richie tested with Open EdX Dogwood to Hawthorn."""

    @property
    def api_client(self):
        """Instantiate and return an edx token API client."""
        return TokenAPIClient(self.configuration["API_TOKEN"])

    def get_enrollment(self, user, url):
        """Get enrollment status for a user on a course run given its url."""

        response = self.api_client.request(
            "GET",
            "{base_url:s}/api/enrollment/v1/enrollment/{username:s},{course_id:s}".format(
                base_url=self.configuration["BASE_URL"],
                username=user.username,
                course_id=self.extract_course_id(url),
            ),
        )

        if response.ok:
            return json.loads(response.content) if response.content else {}

        logger.error(response.content)
        return None

    def set_enrollment(self, user, url):
        """Set enrollment for a user with a course run given its url."""
        course_id = self.extract_course_id(url)
        payload = {"user": user.username, "course_details": {"course_id": course_id}}
        url = "{:s}/api/enrollment/v1/enrollment".format(self.configuration["BASE_URL"])
        response = self.api_client.request("POST", url, json=payload)

        if response.ok:
            data = json.loads(response.content)
            if data["is_active"]:
                return True

        logger.error(response.content)
        return False
