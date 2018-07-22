"""
Unit tests for the Subject factory
"""
import os

from django.test import TestCase

from richie.apps.courses.factories import SubjectFactory


class SubjectFactoryTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Subject factory
    """

    def test_subject_factory_logo(self):
        """
        The SubjectFactory should be able to generate a plugin with a realistic fake logo.
        """
        subject = SubjectFactory(fill_logo=True)

        # Check that the logo plugin was created as expected
        logo = subject.extended_object.placeholders.get(slot="logo")
        self.assertEqual(logo.cmsplugin_set.count(), 1)

        # The logo plugin should point to one of our fixtures images
        logo_plugin = logo.cmsplugin_set.get(plugin_type="PicturePlugin")
        self.assertIn(
            "logo",
            os.path.basename(logo_plugin.djangocms_picture_picture.picture.file.name),
        )

    def test_subject_factory_banner(self):
        """
        The SubjectFactory should be able to generate a plugin with a realistic fake banner.
        """
        subject = SubjectFactory(fill_banner=True)

        # Check that the logo plugin was created as expected
        banner = subject.extended_object.placeholders.get(slot="banner")
        self.assertEqual(banner.cmsplugin_set.count(), 1)

        # The banner plugin should point to one of our fixtures images
        banner_plugin = banner.cmsplugin_set.get(plugin_type="PicturePlugin")
        self.assertIn(
            "banner",
            os.path.basename(banner_plugin.djangocms_picture_picture.picture.file.name),
        )

    def test_subject_factory_description(self):
        """
        The SubjectFactory should be able to generate a plugin with a realistic fake description.
        """
        subject = SubjectFactory(fill_description=True)

        # Check that the description plugin was created as expected
        description = subject.extended_object.placeholders.get(slot="description")
        self.assertEqual(description.cmsplugin_set.count(), 1)

        # The description plugin should contain paragraphs
        description_plugin = description.cmsplugin_set.get(plugin_type="CKEditorPlugin")
        self.assertIn("<p>", description_plugin.simple_text_ckeditor_simpletext.body)
