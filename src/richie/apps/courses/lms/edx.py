"""
Backend to connect Open edX richie with an LMS
"""
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
