"""
Unit tests for the Organization model
"""
import os

from django.test import TestCase

from ..factories import OrganizationFactory


class OrganizationFactoryTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Organization factory
    """

    def test_organization_factory(self):
        """
        OrganizationFactory should be able to generate plugins with realistic fake data: logo,
        banner picture and description.
        """
        organization = OrganizationFactory(with_content=True)

        # Check that the banner and description plugins were created as expected
        placeholder = organization.extended_object.placeholders.get(slot="maincontent")
        self.assertEqual(placeholder.cmsplugin_set.count(), 2)

        # The logo should point to one of our fixtures logos
        # pylint: disable=no-member
        self.assertIn("logo", organization.logo.file.name)

        # The banner plugin should point to one of our fixtures images
        banner_plugin = placeholder.cmsplugin_set.get(plugin_type="PicturePlugin")
        self.assertIn(
            "banner",
            os.path.basename(banner_plugin.djangocms_picture_picture.picture.file.name),
        )

        # The description plugin should contain paragraphs
        description_plugin = placeholder.cmsplugin_set.get(plugin_type="TextPlugin")
        self.assertIn("<p>", description_plugin.djangocms_text_ckeditor_text.body)
