# -*- coding: utf-8 -*-
"""
Unit tests for the Organization plugin and its model
"""
from django import forms
from django.conf import settings
from django.test import TestCase

from cms.api import add_plugin, create_page

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import OrganizationPlugin
from richie.apps.courses.factories import OrganizationFactory
from richie.apps.courses.models import OrganizationPluginModel


class OrganizationPluginTestCase(TestCase):
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
                exclude = ()

        organization = OrganizationFactory()
        other_page_title = "other page"
        create_page(other_page_title, "richie/fullwidth.html", settings.LANGUAGE_CODE)
        plugin_form = OrganizationPluginModelForm()
        self.assertIn(organization.extended_object.get_title(), plugin_form.as_table())
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_organization_render(self):
        """
        Test that an OrganizationPlugin correctly renders organization's page specific information
        """
        # Create an Organization with a page in both english and french
        organization = OrganizationFactory(
            title="Sorbonne",
            languages=["en", "fr"],
            fill_banner=True,
            fill_logo=True,
            fill_description=True,
        )
        organization_page = organization.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(
            placeholder, OrganizationPlugin, "en", **{"organization": organization}
        )
        add_plugin(
            placeholder, OrganizationPlugin, "fr", **{"organization": organization}
        )

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        # The organization's name should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertContains(
            response,
            '<a href="{url}" title="{page_title}">'.format(
                url=organization_page.get_absolute_url(), page_title="Sorbonne en"
            ),
            status_code=200,
        )
        self.assertContains(response, "Sorbonne en", html=True)

        # The organization's logo should be present with the expected resizing
        self.assertContains(response, ".png__216.0x120.0_q85_subsampling-2.png")
        # The organization's full name should be wrapped in a h2
        self.assertContains(
            response,
            '<h2 class="organization-plugin__body__title">Sorbonne en</h2>',
            html=True,
        )

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a href="{url}" title="{page_title}">'.format(
                url=organization_page.get_absolute_url(), page_title="Sorbonne fr"
            ),
            status_code=200,
        )
        self.assertContains(response, "Sorbonne fr", html=True)
        self.assertContains(response, ".png__216.0x120.0_q85_subsampling-2.png")
        # The organization's full name should be wrapped in a h2
        self.assertContains(
            response,
            '<h2 class="organization-plugin__body__title">Sorbonne fr</h2>',
            html=True,
        )
