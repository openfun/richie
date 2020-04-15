# -*- coding: utf-8 -*-
"""
Unit tests for the Organization plugin and its model
"""
import re

from django import forms
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.test.client import RequestFactory

from cms.api import add_plugin, create_page
from cms.plugin_rendering import ContentRenderer
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
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
        in the select box. There shouldn't be any duplicate because of published status.
        """

        class OrganizationPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = OrganizationPluginModel
                fields = ["page"]

        organization = OrganizationFactory(should_publish=True)
        other_page_title = "other page"
        create_page(
            other_page_title, "richie/single_column.html", settings.LANGUAGE_CODE
        )
        plugin_form = OrganizationPluginModelForm()
        rendered_form = plugin_form.as_table()
        self.assertEqual(
            rendered_form.count(organization.extended_object.get_title()), 1
        )
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_organization_render_on_public_page(self):
        """
        The organization plugin should render as expected on a public page.
        """
        # Create an organization
        organization = OrganizationFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_logo={"original_filename": "logo.jpg", "default_alt_text": "my logo"},
        )
        organization_page = organization.extended_object

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
        title_obj.title = "draft title"
        title_obj.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # The organization's name should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertIn(
            (
                '<a class="organization-glimpse organization-glimpse--link '
                'organization-glimpse--glimpse" href="/en/public-title/" '
                'title="public title">'
            ).format(
                url=organization_page.get_absolute_url(),
                title=organization_page.get_title(),
            ),
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # The organization's title should be wrapped in a div
        self.assertContains(
            response,
            '<div class="organization-glimpse__title">{:s}</div>'.format(
                organization.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertNotContains(response, "draft title")

        # Organziation's logo should be present
        pattern = (
            r'<div class="organization-glimpse__logo">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x113'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertIn(
            '<a class="organization-glimpse organization-glimpse--link '
            'organization-glimpse--glimpse" href="/fr/titre-public/" '
            'title="titre public"',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )
        pattern = (
            r'<div class="organization-glimpse__logo">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x113'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_cms_plugins_organization_render_on_draft_page(self):
        """
        The organization plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Organization
        organization = OrganizationFactory(page_title="public title")
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

    def test_cms_plugins_organization_render_instance_variant(self):
        """
        The organization plugin should render according to the variant plugin
        option.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create an Organization
        organization = OrganizationFactory(page_title="public title")
        organization_page = organization.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        # Add organization plugin with default variant
        add_plugin(placeholder, OrganizationPlugin, "en", page=organization_page)

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The organization-glimpse default variant should not have the small attribute
        response = self.client.get(url)
        self.assertNotContains(response, "--small")

        # Add organization plugin with small variant
        add_plugin(
            placeholder,
            OrganizationPlugin,
            "en",
            page=organization_page,
            variant="small",
        )

        # The new organization-glimpse should have the small attribute
        response = self.client.get(url)
        self.assertContains(response, "organization-glimpse--small")

    def test_cms_plugins_organization_render_context_variant(self):
        """
        The organization plugin should render according to variant variable
        eventually present in the context of its container.
        """
        # Create an blogpost
        organization = OrganizationFactory(page_title="public title")
        organization_page = organization.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        # Add blogpost plugin with default template
        model_instance = add_plugin(
            placeholder,
            OrganizationPlugin,
            "en",
            page=organization_page,
            variant="small",
        )

        # Get generated html
        request = RequestFactory()
        request.current_page = page
        request.user = AnonymousUser()
        context = {
            "current_page": page,
            "organization_variant": "xxl",
            "request": request,
        }
        renderer = ContentRenderer(request=request)
        html = renderer.render_plugin(model_instance, context)

        self.assertIn("organization-glimpse--small", html)
