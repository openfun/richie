"""
Unit tests for the Person model factory
"""

import os

from django.test import TestCase

from richie.apps.courses.factories import PersonFactory


class PersonFactoryTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Person factory
    """

    def test_factories_person_portrait(self):
        """
        PersonFactory should be able to generate plugins with a realistic portrait
        for several languages.
        """
        person = PersonFactory(page_languages=["fr", "en"], fill_portrait=True)

        # Check that the portrait plugins were created as expected
        portrait = person.extended_object.placeholders.get(slot="portrait")
        self.assertEqual(portrait.cmsplugin_set.count(), 2)

        # The portrait plugins should point to one of our fixtures images
        for language in ["fr", "en"]:
            portrait_plugin = portrait.cmsplugin_set.get(
                plugin_type="SimplePicturePlugin", language=language
            )
            self.assertIn(
                "portrait",
                os.path.basename(
                    portrait_plugin.djangocms_picture_picture.picture.file.name
                ),
            )

    def test_factories_person_bio(self):
        """
        PersonFactory should be able to generate plugins with a realistic bio for
        several languages.
        """
        person = PersonFactory(page_languages=["fr", "en"], fill_bio=True)

        # Check that the bio plugins were created as expected
        bio = person.extended_object.placeholders.get(slot="bio")
        self.assertEqual(bio.cmsplugin_set.count(), 2)

        # The bio plugins should contain paragraphs
        for language in ["fr", "en"]:
            bio_plugin = bio.cmsplugin_set.get(
                plugin_type="PlainTextPlugin", language=language
            )
            self.assertTrue(bio_plugin.plain_text_plaintext.body.count(".") >= 2)
