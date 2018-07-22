"""
Unit tests for the Person model factory
"""
import os

from django.test import TestCase

from richie.apps.persons.factories import PersonFactory


class PersonFactoryTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Person factory
    """

    def test_person_factory(self):
        """
        PersonFactoryTestCase should be able to generate plugins with realistic fake
        data: portrait and resume.
        """
        person = PersonFactory(with_content=True)

        # The portrait plugin should point to one of our fixtures images
        portrait_placeholder = person.extended_object.placeholders.get(slot="portrait")
        portrait_plugin = portrait_placeholder.cmsplugin_set.get(
            plugin_type="PicturePlugin"
        )
        self.assertIn(
            "portrait",
            os.path.basename(
                portrait_plugin.djangocms_picture_picture.picture.file.name
            ),
        )

        # The resume plugin should contain paragraphs
        resume_placeholder = person.extended_object.placeholders.get(slot="resume")
        resume_plugin = resume_placeholder.cmsplugin_set.get(
            plugin_type="CKEditorPlugin"
        )
        self.assertIn("<p>", resume_plugin.simple_text_ckeditor_simpletext.body)
