"""
Unit tests for the `normalize_whitespace` template filter.
"""

from django.template import Context, Template
from django.test import TestCase

from richie.apps.core.templatetags.normalize_whitespace import normalize_whitespace


class NormalizeWhitespaceTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `normalize_whitespace` template filter.
    """

    def test_templatetags_normalize_whitespace_collapses_runs(self):
        """Runs of spaces, tabs and newlines should collapse to a single space."""
        self.assertEqual(
            normalize_whitespace(
                "\n    Very interesting course \n\t   -   \n example.com  "
            ),
            "Very interesting course - example.com",
        )

    def test_templatetags_normalize_whitespace_empty(self):
        """An empty or whitespace-only value should render as an empty string."""
        self.assertEqual(normalize_whitespace(""), "")
        self.assertEqual(normalize_whitespace("  \n\t "), "")

    def test_templatetags_normalize_whitespace_as_filter_block(self):
        """The filter should work on a `{% filter %}` block spanning several lines."""
        template = Template(
            "{% load normalize_whitespace %}"
            "<title>{% filter normalize_whitespace %}\n"
            "    {{ title }}\n"
            "     - \n"
            "    {{ site }}\n"
            "{% endfilter %}</title>"
        )
        self.assertEqual(
            template.render(Context({"title": "My title", "site": "example.com"})),
            "<title>My title - example.com</title>",
        )

    def test_templatetags_normalize_whitespace_keeps_escaping(self):
        """Autoescaping of variables should be preserved by the filter."""
        template = Template(
            "{% load normalize_whitespace %}"
            "{% filter normalize_whitespace %}  {{ title }}  {% endfilter %}"
        )
        self.assertEqual(
            template.render(Context({"title": "A & B <i>"})),
            "A &amp; B &lt;i&gt;",
        )
