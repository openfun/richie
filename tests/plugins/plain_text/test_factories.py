"""
Factory tests
"""

from django.test import TestCase

from richie.plugins.plain_text.factories import PlainTextFactory


class PlainTextFactoriesTestCase(TestCase):
    """Tests for the PlainText factory"""

    def test_factories_plaintext_create_success(self):
        """Factory creation success."""
        plaintext = PlainTextFactory()
        self.assertIsNotNone(plaintext.body)
