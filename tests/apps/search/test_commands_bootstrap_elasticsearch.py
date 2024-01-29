"""
Tests for the regenerate_index command
"""

import logging
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from richie.apps.search import index_manager

logger = logging.getLogger("richie.search.bootstrap_elasticsearch")


class BootstrapElasticsearchCommandsTestCase(TestCase):
    """
    Test the command that regenerates the Elasticsearch indices.
    """

    @mock.patch.object(index_manager, "regenerate_indices")
    @mock.patch.object(index_manager, "store_es_scripts")
    @mock.patch.object(logger, "info")
    def test_commands_bootstrap_elasticsearch(
        self, mock_info, mock_store, mock_regenerate
    ):
        """
        Delegate all logic to the index_manager module, log time elapsed at the end
        """
        call_command("bootstrap_elasticsearch")
        mock_regenerate.assert_called_once()
        mock_store.assert_called_once()
        self.assertEqual(mock_info.call_count, 4)
