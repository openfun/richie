"""
Tests for the regenerate_index command
"""
import logging
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from apps.search import index_manager

logger = logging.getLogger("richie.core.regenerate_indexes")


class RegenerateIndexesTestCase(TestCase):
    """
    Test the command that regenerates the Elasticsearch indexes.
    """

    @mock.patch.object(index_manager, "regenerate_indexes")
    @mock.patch.object(logger, "info")
    def test_regenerate_indexes(self, mock_info, mock_regenerate):
        """
        Delegate all logic to the index_manager module, log time elapsed at the end
        """
        call_command("regenerate_indexes")
        mock_regenerate.assert_called()
        self.assertEqual(mock_info.call_count, 2)
