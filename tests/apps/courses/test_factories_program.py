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

    def test_factories_program_description(self):
        """
        ProgramFactory should be able to generate plugins with a realistic description for
        several languages.
        """
        program = ProgramFactory(page_languages=["fr", "en"], fill_description=True)

        # Check that the description plugins were created as expected
        description = program.extended_object.placeholders.get(
            slot="program_description"
        )
        self.assertEqual(description.cmsplugin_set.count(), 2)

        # The description plugins should contain paragraphs
        for language in ["fr", "en"]:
            description_plugin = description.cmsplugin_set.get(
                plugin_type="PlainTextPlugin", language=language
            )
            self.assertTrue(len(description_plugin.plain_text_plaintext.body) > 0)
