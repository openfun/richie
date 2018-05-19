"""
Test for the API consumption utils
"""
from django.test import TestCase
import responses

from ..exceptions import ApiConsumingException
from ..utils.api_consumption import walk_api_json_list


class ApiConsumptionTestCase(TestCase):
    """
    Test our walk_api_json_list function that enables us to easily consume a list API
    endpoint without having to worry about walking all its pages
    """

    @responses.activate
    def test_walk_api_json_list(self):
        """
        Happy path: the API responds as intended and we get to yield the successive pages
        """
        response_page_1 = {
            "count": 51,
            "results": [{"id": 42, "name": "Stub Forty-Two"}],
        }
        responses.add(
            method="GET",
            url="https://example.com/api/stub?page=1&rpp=50",
            match_querystring=True,
            json=response_page_1,
        )

        response_page_2 = {
            "count": 51,
            "results": [{"id": 44, "name": "Stub Forty-Four"}],
        }
        responses.add(
            method="GET",
            url="https://example.com/api/stub?page=2&rpp=50",
            match_querystring=True,
            json=response_page_2,
        )

        content_pages = list(walk_api_json_list("https://example.com/api/stub"))

        self.assertEqual(content_pages, [response_page_1, response_page_2])

    @responses.activate
    def test_walk_api_json_list_with_error_status(self):
        """
        Error case: the API responds with an HTTP error code
        """
        responses.add(method="GET", url="https://example.com/api/stub", status=500)

        # The call raised the correct exception
        with self.assertRaises(ApiConsumingException):
            list(walk_api_json_list("https://example.com/api/stub"))

    @responses.activate
    def test_walk_api_json_list_with_invalid_json(self):
        """
        Error case: the API did not return valid JSON
        """
        responses.add(
            method="GET",
            url="https://example.com/api/stub",
            status=200,
            body="broken_json",
        )

        with self.assertRaises(ApiConsumingException):
            list(walk_api_json_list("https://example.com/api/stub"))

    @responses.activate
    def test_walk_api_json_list_with_incorrect_count_path(self):
        """
        Error case: our count argument is not where we expected to find it
        """
        responses.add(
            method="GET",
            url="https://example.com/api/stub",
            status=200,
            json={"results": [{"id": 42, "name": "Stub Forty-Two"}]},
        )

        with self.assertRaises(ApiConsumingException):
            list(walk_api_json_list("https://example.com/api/stub"))
