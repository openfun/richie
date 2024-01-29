"""
Unit tests for the BlogPost factory
"""

import os

from django.test import TestCase

from richie.apps.courses.factories import BlogPostFactory


class BlogPostFactoryTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the BlogPost factory
    """

    def test_factories_blogpost_cover(self):
        """
        BlogPostFactory should be able to generate plugins with a realistic cover for several
        languages.
        """
        blogpost = BlogPostFactory(page_languages=["fr", "en"], fill_cover=True)

        # Check that the cover plugins were created as expected
        cover = blogpost.extended_object.placeholders.get(slot="cover")
        self.assertEqual(cover.cmsplugin_set.count(), 2)

        # The cover plugins should point to one of our fixtures images
        for language in ["fr", "en"]:
            cover_plugin = cover.cmsplugin_set.get(
                plugin_type="SimplePicturePlugin", language=language
            )
            self.assertIn(
                "cover",
                os.path.basename(
                    cover_plugin.djangocms_picture_picture.picture.file.name
                ),
            )

    def test_factories_blogpost_body(self):
        """
        BlogPostFactory should be able to generate plugins with a realistic body for
        several languages.
        """
        blogpost = BlogPostFactory(page_languages=["fr", "en"], fill_body=True)

        # Check that the body plugins were created as expected
        body = blogpost.extended_object.placeholders.get(slot="body")
        self.assertEqual(body.cmsplugin_set.count(), 2)

        # The body plugins should contain paragraphs
        for language in ["fr", "en"]:
            description_plugin = body.cmsplugin_set.get(
                plugin_type="TextPlugin", language=language
            )
            self.assertIn("<p>", description_plugin.djangocms_text_ckeditor_text.body)
