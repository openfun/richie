"""
Unit tests for the Organization model
"""

import os

from django.test import TestCase

from richie.apps.courses.factories import OrganizationFactory


class OrganizationFactoryTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Organization factory
    """

    def test_factories_organization_logo(self):
        """
        OrganizationFactory should be able to generate plugins with a realistic logo for several
        languages.
        """
        organization = OrganizationFactory(page_languages=["fr", "en"], fill_logo=True)

        # Check that the logo plugins were created as expected
        logo = organization.extended_object.placeholders.get(slot="logo")
        self.assertEqual(logo.cmsplugin_set.count(), 2)

        # The logo plugins should point to one of our fixtures images
        for language in ["fr", "en"]:
            logo_plugin = logo.cmsplugin_set.get(
                plugin_type="SimplePicturePlugin", language=language
            )
            self.assertIn(
                "logo",
                os.path.basename(
                    logo_plugin.djangocms_picture_picture.picture.file.name
                ),
            )

    def test_factories_organization_banner(self):
        """
        OrganizationFactory should be able to generate plugins with a realistic banner for several
        languages.
        """
        organization = OrganizationFactory(
            page_languages=["fr", "en"], fill_banner=True
        )

        # Check that the banner plugins were created as expected
        banner = organization.extended_object.placeholders.get(slot="banner")
        self.assertEqual(banner.cmsplugin_set.count(), 2)

        # The banner plugins should point to one of our fixtures images
        for language in ["fr", "en"]:
            banner_plugin = banner.cmsplugin_set.get(
                plugin_type="SimplePicturePlugin", language=language
            )
            self.assertIn(
                "banner",
                os.path.basename(
                    banner_plugin.djangocms_picture_picture.picture.file.name
                ),
            )

    def test_factories_organization_description(self):
        """
        OrganizationFactory should be able to generate plugins with a realistic description for
        several languages.
        """
        organization = OrganizationFactory(
            page_languages=["fr", "en"], fill_description=True
        )

        # Check that the description plugins were created as expected
        description = organization.extended_object.placeholders.get(slot="description")
        self.assertEqual(description.cmsplugin_set.count(), 2)

        # The description plugins should contain paragraphs
        for language in ["fr", "en"]:
            description_plugin = description.cmsplugin_set.get(
                plugin_type="CKEditorPlugin", language=language
            )
            self.assertIn(
                "<p>", description_plugin.simple_text_ckeditor_simpletext.body
            )
