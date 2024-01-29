"""
Unit tests for the Program factory
"""

import os

from django.test import TestCase

from richie.apps.courses.factories import ProgramFactory


class ProgramFactoryTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Program factory
    """

    def test_factories_program_body(self):
        """
        ProgramFactory should be able to generate plugins with a realistic body for
        several languages.
        """
        program = ProgramFactory(page_languages=["fr", "en"], fill_body=True)

        # Check that the body plugins were created as expected
        body = program.extended_object.placeholders.get(slot="program_body")
        self.assertEqual(body.cmsplugin_set.count(), 2)

        # The body plugins should contain paragraphs
        for language in ["fr", "en"]:
            description_plugin = body.cmsplugin_set.get(
                plugin_type="TextPlugin", language=language
            )
            self.assertIn("<p>", description_plugin.djangocms_text_ckeditor_text.body)

    def test_factories_program_cover(self):
        """
        ProgramFactory should be able to generate plugins with a realistic cover for several
        languages.
        """
        program = ProgramFactory(page_languages=["fr", "en"], fill_cover=True)

        # Check that the cover plugins were created as expected
        cover = program.extended_object.placeholders.get(slot="program_cover")
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

    def test_factories_program_excerpt(self):
        """
        ProgramFactory should be able to generate plugins with a realistic excerpt for
        several languages.
        """
        program = ProgramFactory(page_languages=["fr", "en"], fill_excerpt=True)

        # Check that the excerpt plugins were created as expected
        excerpt = program.extended_object.placeholders.get(slot="program_excerpt")
        self.assertEqual(excerpt.cmsplugin_set.count(), 2)

        # The excerpt plugins should contain paragraphs
        for language in ["fr", "en"]:
            excerpt_plugin = excerpt.cmsplugin_set.get(
                plugin_type="PlainTextPlugin", language=language
            )
            self.assertTrue(len(excerpt_plugin.plain_text_plaintext.body) > 0)
