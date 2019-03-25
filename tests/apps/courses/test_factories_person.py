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
                plugin_type="PicturePlugin", language=language
            )
            self.assertIn(
                "portrait",
                os.path.basename(
                    portrait_plugin.djangocms_picture_picture.picture.file.name
                ),
            )

    def test_factories_person_resume(self):
        """
        PersonFactory should be able to generate plugins with a realistic resume for
        several languages.
        """
        person = PersonFactory(page_languages=["fr", "en"], fill_resume=True)

        # Check that the resume plugins were created as expected
        resume = person.extended_object.placeholders.get(slot="resume")
        self.assertEqual(resume.cmsplugin_set.count(), 2)

        # The resume plugins should contain paragraphs
        for language in ["fr", "en"]:
            resume_plugin = resume.cmsplugin_set.get(
                plugin_type="CKEditorPlugin", language=language
            )
            self.assertIn("<p>", resume_plugin.simple_text_ckeditor_simpletext.body)
