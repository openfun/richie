"""
Unit tests for the BlogPost model
"""
from django.test import TestCase

from cms.api import add_plugin, create_page

from richie.apps.courses.factories import BlogPostFactory, CategoryFactory
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

    @staticmethod
    def _attach_category(blogpost, category):
        """Not a test. Utility method to easily attach a category to a blogpost."""
        placeholder = blogpost.extended_object.placeholders.get(slot="categories")
        add_plugin(placeholder, "CategoryPlugin", "en", page=category.extended_object)

    def test_models_blogpost_get_related_blogposts(self):
        """
        Blogposts related via a plugin on the draft page should appear in
        their draft version on the draft page.
        Blogposts related via a plugin on the public page should appear in
        their public version on the public page.
        """
        blogpost1, blogpost2, blogpost3 = BlogPostFactory.create_batch(
            3, should_publish=True
        )
        category = CategoryFactory(should_publish=True)

        # Attach categories
        self._attach_category(blogpost1, category)
        self._attach_category(blogpost2, category)
        self._attach_category(blogpost1.public_extension, category)
        self._attach_category(blogpost3.public_extension, category)

        # Draft blogposts
        with self.assertNumQueries(1):
            self.assertEqual(list(blogpost1.get_related_blogposts()), [blogpost2])
        with self.assertNumQueries(1):
            self.assertEqual(list(blogpost2.get_related_blogposts()), [blogpost1])
        # 2 queries because blogpost3 page fields were not retrieved when attaching categories
        with self.assertNumQueries(2):
            self.assertFalse(blogpost3.get_related_blogposts().exists())

        blogpost1_public = blogpost1.public_extension
        with self.assertNumQueries(1):
            self.assertEqual(
                list(blogpost1_public.get_related_blogposts()),
                [blogpost3.public_extension],
            )

        # Public blogposts
        blogpost2_public = blogpost2.public_extension
        # 2 queries because blogpost2.public_extension page fields were not retrieved when
        # attaching categories
        with self.assertNumQueries(2):
            self.assertFalse(blogpost2_public.get_related_blogposts().exists())

        blogpost3_public = blogpost3.public_extension
        with self.assertNumQueries(1):
            self.assertEqual(
                list(blogpost3_public.get_related_blogposts()),
                [blogpost1.public_extension],
            )
