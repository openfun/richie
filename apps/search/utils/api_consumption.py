"""
Utility module that enables to factorize some API consumption logic between e.g. indexer
classes or other tools that need to fetch data from an API
"""
import math

import requests

from ..exceptions import ApiConsumingException


# pylint: disable=too-many-arguments
def walk_api_json_list(
    root_url,
    page_length_arg="rpp",
    page_length=50,
    paginate_arg="page",
    paginate_type="page_number",
    total_count_key="count",
):
    """
    Iterate over the pages of an API list endpoint and return a generator that yields the content
    for each page as a parsed object
    """
    # Set initial request params. Use math.inf so the first request always fires
    offset = 0
    total_count = math.inf

    # Iterate over the API as long as there are results to get
    while total_count > offset:
        response = requests.get(
            root_url,
            params={
                paginate_arg: offset
                if paginate_type == "offset"
                else 1 + offset // page_length,
                page_length_arg: page_length,
            },
        )

        # Make sure we throw if we received an invalid status code so everything is stopped
        try:
            response.raise_for_status()
        except requests.HTTPError:
            raise ApiConsumingException(
                "HTTP Request during API walk failed with code {:n}".format(
                    response.status_code
                )
            )

        # Get the parsed JSON content from the request
        try:
            content_page = response.json()
        except requests.compat.json.decoder.JSONDecodeError:
            raise ApiConsumingException("Invalid JSON received from remote API")

        try:
            # Set the params for the next request (or to exit the loop)
            total_count = content_page["count"]
        except KeyError:
            raise ApiConsumingException(
                "Cannot read total_count_key {:s} in json response".format(
                    total_count_key
                )
            )

        # Pass the content to consumer
        yield content_page

        # Prepare the offset for the next request
        offset = offset + page_length
