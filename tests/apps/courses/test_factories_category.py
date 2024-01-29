"""
Unit tests for the Category factory
"""

import os

from django.test import TestCase

from richie.apps.courses.factories import CategoryFactory


class CategoryFactoriesTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Category factory
    """

    def test_factories_category_color(self):
        """The category factory should leave the color field null."""
        category = CategoryFactory()
        self.assertIsNone(category.color)

    def test_factories_category_logo(self):
        """
        The CategoryFactory should be able to generate a plugin with a realistic fake logo.
        """
        category = CategoryFactory(fill_logo=True)

        # Check that the logo plugin was created as expected
        logo = category.extended_object.placeholders.get(slot="logo")
        self.assertEqual(logo.cmsplugin_set.count(), 1)

        # The logo plugin should point to one of our fixtures images
        logo_plugin = logo.cmsplugin_set.get(plugin_type="SimplePicturePlugin")
        self.assertIn(
            "logo",
            os.path.basename(logo_plugin.djangocms_picture_picture.picture.file.name),
        )

    def test_factories_category_banner(self):
        """
        The CategoryFactory should be able to generate a plugin with a realistic fake banner.
        """
        category = CategoryFactory(fill_banner=True)

        # Check that the logo plugin was created as expected
        banner = category.extended_object.placeholders.get(slot="banner")
        self.assertEqual(banner.cmsplugin_set.count(), 1)

        # The banner plugin should point to one of our fixtures images
        banner_plugin = banner.cmsplugin_set.get(plugin_type="SimplePicturePlugin")
        self.assertIn(
            "banner",
            os.path.basename(banner_plugin.djangocms_picture_picture.picture.file.name),
        )

    def test_factories_category_description(self):
        """
        The CategoryFactory should be able to generate a plugin with a realistic fake description.
        """
        category = CategoryFactory(fill_description=True)

        # Check that the description plugin was created as expected
        description = category.extended_object.placeholders.get(slot="description")
        self.assertEqual(description.cmsplugin_set.count(), 1)

        # The description plugin should contain paragraphs
        description_plugin = description.cmsplugin_set.get(plugin_type="CKEditorPlugin")
        self.assertIn("<p>", description_plugin.simple_text_ckeditor_simpletext.body)
