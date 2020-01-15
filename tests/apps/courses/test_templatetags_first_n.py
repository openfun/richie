"""
Unit tests for templatetags in the courses app.
"""
from django.test import TestCase

from richie.apps.courses.templatetags.first_n import first_n_filter


class FirstNTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `first_n` template filter.
    """

    def test_first_n(self):
        """
        Make sure the first_n filter picks the first N elements in a list or a string.
        """
        self.assertEqual(first_n_filter(["a", "b", "c"], 2), ["a", "b"])
        self.assertEqual(first_n_filter("DEFG", 3), "DEF")
