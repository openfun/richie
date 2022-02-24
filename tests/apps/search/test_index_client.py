"""
Test the index client initialization.
"""
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.search import new_elasticsearch_client


class IndexClientTestCase(TestCase):
    """
    Test the index client.
    """

    @override_settings(RICHIE_ES_CLIENT_KWARGS={"timeout": 99})
    def test_index_client_kwargs(self):
        """
        Test `RICHIE_ES_CLIENT_KWARGS` setting, that allows to pass extra configurations to the
        elastic search index client.
        """
        es_client_to_test = new_elasticsearch_client()
        self.assertEqual(es_client_to_test.transport.kwargs, {"timeout": 99})
