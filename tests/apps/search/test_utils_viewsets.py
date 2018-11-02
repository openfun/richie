"""
Tests for the viewset helpers.
"""
from types import SimpleNamespace
from unittest import mock

from django.conf import settings
from django.http.request import QueryDict
from django.test import TestCase

from richie.apps.search.utils.viewsets import AutocompleteMixin, ViewSetMetadata


class Indexer:
    """Stub indexer to set on our `ExampleViewSet`."""

    index_name = "some_index"
    document_type = "some_type"

    @staticmethod
    def format_es_object_for_api(obj, _):
        """Just return the object as-is with a formatted flag."""
        return {**obj, "formatted": True}


class UtilsViewSetsTestCase(TestCase):
    """
    Test any functions we're exposing for use in our viewsets.
    """

    @mock.patch(
        "richie.apps.search.utils.viewsets.get_language_from_request", lambda _: "en"
    )
    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_autocomplete_mixin(self, mock_search, *_):
        """
        The autocomplete mixin adds an `autocomplete` method that makes a completion call to
        elasticsearch and returns a list of formatted results.
        """
        mock_search.return_value = {
            "suggest": {"organizations": [{"options": [{"id": 0}, {"id": 1}]}]}
        }

        class ExampleViewSet(AutocompleteMixin):
            """Instantiate a stub `ViewSet` to test the mixin."""

            _meta = ViewSetMetadata(Indexer)

        request = SimpleNamespace(
            query_params=QueryDict(query_string="query=some%20query")
        )
        response = ExampleViewSet().autocomplete(request, "1.0")

        # Make sure the ES client was called with the proper params
        mock_search.assert_called_with(
            body={
                "suggest": {
                    "organizations": {
                        "prefix": "some query",
                        "completion": {"field": "complete.en"},
                    }
                }
            },
            doc_type="some_type",
            index="some_index",
        )
        # The helper returns the list of results, as formatted by the indexer
        self.assertEqual(
            response.data, [{"id": 0, "formatted": True}, {"id": 1, "formatted": True}]
        )

    @mock.patch(
        "richie.apps.search.utils.viewsets.get_language_from_request", lambda _: "en"
    )
    @mock.patch.object(settings.ES_CLIENT, "search")
    def test_autocomplete_mixin_without_results(self, mock_search, *_):
        """
        The autocomplete mixin returns an empty answer when there is nothing to suggest.
        """
        mock_search.return_value = {"suggest": {"organizations": [{"options": []}]}}

        class ExampleViewSet(AutocompleteMixin):
            """Instantiate a stub `ViewSet` to test the mixin."""

            _meta = ViewSetMetadata(Indexer)

        # We're making the same call as in the test above
        request = SimpleNamespace(
            query_params=QueryDict(query_string="query=some%20query")
        )
        response = ExampleViewSet().autocomplete(request, "1.0")

        # The helper returns an empty list as there are not results
        self.assertEqual(response.data, [])
