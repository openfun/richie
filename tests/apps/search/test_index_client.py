"""
Test the index client initialization.
"""

from django.test import TestCase
from django.test.utils import override_settings


class IndexClientTestCase(TestCase):
    """
    Test the index client.
    """

    # pylint: disable=import-outside-toplevel
    @override_settings(RICHIE_ES_CLIENT_KWARGS={"timeout": 99})
    def test_index_client_kwargs(self):
        """
        Test `RICHIE_ES_CLIENT_KWARGS` setting, that allows to pass extra configurations to the
        elastic search index client.
        """
        from richie.apps.search.apps import init_es

        init_es()
        from richie.apps.search.apps import ES_CLIENT

        self.assertEqual(ES_CLIENT.transport.kwargs, {"timeout": 99})
