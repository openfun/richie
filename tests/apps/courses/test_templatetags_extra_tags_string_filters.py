"""
Unit tests for the string manipulation template filters.
"""

from django.test import TestCase

from richie.apps.courses.templatetags.extra_tags import trim


class StringFiltersTestCase(TestCase):
    """
    Unit test suite to validate the behavior of string manipulation template filters.
    """

    def test_templatetags_extra_tag_string_filterss_trim(self):
        """
        The trim filter should remove whitespace from both ends of a string.
        """
        self.assertEqual("test", trim("  test  "))
        self.assertEqual("test", trim("test  "))
        self.assertEqual("test", trim("  test"))
        self.assertEqual("test test", trim("  test test  "))
        self.assertEqual("", trim("   "))
        self.assertEqual("", trim(""))
