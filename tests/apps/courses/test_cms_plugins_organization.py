# -*- coding: utf-8 -*-
"""
Unit tests for the Organization plugin and its model
"""
from django import forms
from django.conf import settings

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from djangocms_picture.cms_plugins import PicturePlugin

from richie.apps.core.factories import FilerImageFactory, UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import OrganizationPlugin
from richie.apps.courses.factories import OrganizationFactory
from richie.apps.courses.models import OrganizationPluginModel


class OrganizationPluginTestCase(CMSTestCase):
    """
    Test that OrganizationPlugin correctly displays a Organization's page placeholders content
    """

    def test_cms_plugins_organization_form_page_choices(self):
        """
        The form to create a organization plugin should only list organization pages
        in the select box.
        """

        class OrganizationPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = OrganizationPluginModel
                fields = ["page"]

        organization = OrganizationFactory()
        other_page_title = "other page"
        create_page(other_page_title, "richie/fullwidth.html", settings.LANGUAGE_CODE)
        plugin_form = OrganizationPluginModelForm()
        self.assertIn(organization.extended_object.get_title(), plugin_form.as_table())
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_organization_render_on_public_page(self):
        """
        The organization plugin should render as expected on a public page.
        """
        # Create a filer fake image
        image = FilerImageFactory()

        # Create an organization
        organization = OrganizationFactory(
            title={"en": "public title", "fr": "titre publique"}
        )
        organization_page = organization.extended_object

        # Add logo to related placeholder
        logo_placeholder = organization_page.placeholders.get(slot="logo")
        add_plugin(
            logo_placeholder,
            PicturePlugin,
            "en",
            **{"picture": image, "attributes": {"alt": "logo description"}}
        )
        add_plugin(
            logo_placeholder,
            PicturePlugin,
            "fr",
            **{"picture": image, "attributes": {"alt": "description du logo"}}
        )

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, OrganizationPlugin, "en", **{"page": organization_page})
        add_plugin(placeholder, OrganizationPlugin, "fr", **{"page": organization_page})

        organization_page.publish("en")
        organization_page.publish("fr")
        organization.refresh_from_db()

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")

        # The organization plugin should not be visible on the public page before it is published
        organization_page.unpublish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # # Republish the plugin
        organization_page.publish("en")

        # Now modify the organization to have a draft different from the public version
        title_obj = organization_page.get_title_obj(language="en")
        title_obj.tile = "draft title"
        title_obj.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # The organization's name should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertContains(
            response,
            '<a class="organization-plugin__body" href="/en/public-title/" title="{:s}"'.format(
                organization.public_extension.extended_object.get_title()
            ),
            status_code=200,
        )
        # The organization's title should be wrapped in a div
        self.assertContains(
            response,
            '<div class="organization-plugin__title">{:s}</div>'.format(
                organization.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertNotContains(response, "draft title")

        # Organziation's logo should be present
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a class="organization-plugin__body" href="/fr/titre-publique/" title="{:s}"'.format(
                organization.public_extension.extended_object.get_title()
            ),
            status_code=200,
        )
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)

    def test_cms_plugins_organization_render_on_draft_page(self):
        """
        The organization plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Organization
        organization = OrganizationFactory(title="public title")
        organization_page = organization.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, OrganizationPlugin, "en", **{"page": organization_page})

        organization_page.publish("en")
        organization_page.unpublish("en")
        organization_page.refresh_from_db()

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The organization plugin should still be visible on the draft page
        response = self.client.get(url)
        self.assertContains(response, "public title")

        # Now modify the organization to have a draft different from the public version
        title_obj = organization_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the organization plugin should now be visible
        response = self.client.get(url)
        self.assertContains(response, "draft title")
        self.assertNotContains(response, "public title")
