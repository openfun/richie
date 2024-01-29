"""
Unit tests for the BlogPost model
"""

import random

from django.test import TestCase
from django.test.utils import override_settings
from django.utils import translation

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

        # - Draft blogposts
        with self.assertNumQueries(2):
            self.assertEqual(list(blogpost1.get_related_blogposts()), [blogpost2])

        with self.assertNumQueries(2):
            self.assertEqual(list(blogpost2.get_related_blogposts()), [blogpost1])

        # 3 queries because blogpost3 page fields were not retrieved when attaching categories
        with self.assertNumQueries(3):
            self.assertFalse(blogpost3.get_related_blogposts().exists())

        # - Public blogposts
        blogpost1_public = blogpost1.public_extension
        with self.assertNumQueries(2):
            self.assertEqual(
                list(blogpost1_public.get_related_blogposts()),
                [blogpost3.public_extension],
            )

        blogpost2_public = blogpost2.public_extension
        # 3 queries because blogpost2.public_extension page fields were not retrieved when
        # attaching categories
        with self.assertNumQueries(3):
            self.assertFalse(blogpost2_public.get_related_blogposts().exists())

        blogpost3_public = blogpost3.public_extension
        with self.assertNumQueries(2):
            self.assertEqual(
                list(blogpost3_public.get_related_blogposts()),
                [blogpost1.public_extension],
            )

    def test_models_blogpost_get_related_blogposts_ordering(self):
        """Related blogposts should be ordered by their publication date."""
        blogpost = BlogPostFactory(should_publish=True)
        related_blogposts = BlogPostFactory.create_batch(3)

        category = CategoryFactory()
        self._attach_category(blogpost, category)

        # Publish the related blogposts in a random order and attach them to the same category
        random.shuffle(related_blogposts)
        for post in related_blogposts:
            post.extended_object.publish("en")
            self._attach_category(post, category)

        # Draft blogposts
        previous_post = None
        for post in blogpost.get_related_blogposts():
            if previous_post is None:
                previous_post = post
                continue
            self.assertGreater(
                previous_post.extended_object.publication_date,
                post.extended_object.publication_date,
            )

    @override_settings(
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }
    )
    # pylint: disable=too-many-statements
    def test_models_blogpost_get_related_blogposts_language_fallback(self):
        """
        Validate that the related blogposts lookup works as expected with language fallback.
        """
        category1, category2, category3 = CategoryFactory.create_batch(
            3, should_publish=True
        )
        blogpost, blogpost1, blogpost2, blogpost3 = BlogPostFactory.create_batch(
            4, should_publish=True
        )
        ph_blogpost = blogpost.extended_object.placeholders.get(slot="categories")
        ph_blogpost1 = blogpost1.extended_object.placeholders.get(slot="categories")
        ph_blogpost2 = blogpost2.extended_object.placeholders.get(slot="categories")
        ph_blogpost3 = blogpost3.extended_object.placeholders.get(slot="categories")

        # Related blogpost lookup should fallback up to the second priority language
        add_plugin(ph_blogpost, "CategoryPlugin", "de", page=category1.extended_object)
        add_plugin(ph_blogpost1, "CategoryPlugin", "de", page=category1.extended_object)

        with translation.override("en"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost1])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])

        with translation.override("fr"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost1])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost1])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(ph_blogpost, "CategoryPlugin", "fr", page=category2.extended_object)
        add_plugin(ph_blogpost2, "CategoryPlugin", "fr", page=category2.extended_object)

        with translation.override("en"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost2])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])

        with translation.override("fr"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost2])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost1])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(ph_blogpost, "CategoryPlugin", "en", page=category3.extended_object)
        add_plugin(ph_blogpost3, "CategoryPlugin", "en", page=category3.extended_object)

        with translation.override("en"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost3])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [blogpost])

        with translation.override("fr"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost2])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(blogpost.get_related_blogposts()), [blogpost1])
            self.assertEqual(list(blogpost1.get_related_blogposts()), [blogpost])
            self.assertEqual(list(blogpost2.get_related_blogposts()), [])
            self.assertEqual(list(blogpost3.get_related_blogposts()), [])
