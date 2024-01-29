"""
Factory tests
"""

from django.test import TestCase

from richie.plugins.simple_text_ckeditor.factories import SimpleTextFactory


class SimpleTextFactoriesTestCase(TestCase):
    """Tests for the SimpleText factory"""

    def test_factories_simpletext_create_success(self):
        """
        Factory creation success
        """
        simpletext = SimpleTextFactory(body="Foo")
        self.assertEqual("Foo", simpletext.body)
