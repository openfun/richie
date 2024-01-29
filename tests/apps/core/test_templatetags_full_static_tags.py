"""
Unit tests for the template tags of the full static tags.
"""

from django.template import Context, Template
from django.test import TestCase
from django.test.client import RequestFactory


class FullStaticTagsTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `full_static_tags` template tag.
    """

    def test_templatetags_full_static_tags(self):
        """
        The full_static_tags template tag retrieves the full URL for a registered static asset
        """
        request = RequestFactory().get("/")
        out = Template(
            "{% load full_static_tags %}" + "{% static_absolute 'image.png' %}"
        ).render(Context({"request": request}))
        self.assertEqual(out, "http://testserver/static/image.png")
