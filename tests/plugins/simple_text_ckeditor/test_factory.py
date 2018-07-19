"""
Factory tests
"""
from django.test import TestCase

from richie.plugins.simple_text_ckeditor.factories import SimpleTextFactory


class SimpleTextFactoryTests(TestCase):
    """Factory tests case"""

    def test_simpletext_create_success(self):
        """
        Factory creation success
        """
        simpletext = SimpleTextFactory(body="Foo")
        self.assertEqual("Foo", simpletext.body)
