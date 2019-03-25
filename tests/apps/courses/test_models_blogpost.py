"""
Unit tests for the BlogPost model
"""
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.models import BlogPost


class BlogPostModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the BlogPost model
    """

    def test_models_blogpost_str(self):
        """
        The str representation should be built with the page title and code field only.
        A query to the associated page should be generated.
        """
        page = create_page("My first article", "courses/cms/blogpost_detail.html", "en")
        blogpost = BlogPost(extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(blogpost), "Blog Post: My first article")
