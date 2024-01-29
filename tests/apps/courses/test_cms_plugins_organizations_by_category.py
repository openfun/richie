"""Unit tests for the Organizations by Category plugin and its model."""

import re

from django import forms

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import OrganizationsByCategoryPlugin
from richie.apps.courses.factories import CategoryFactory, OrganizationFactory
from richie.apps.courses.models import OrganizationsByCategoryPluginModel


class OrganizationsByCategoryPluginTestCase(CMSTestCase):
    """
    Test that OrganizationsByCategoryPlugin correctly displays a list of organizations related
    to a category.
    """

    def test_cms_plugins_organizations_by_category_form_page_choices(self):
        """
        The form to create an organizations by category plugin should only list category pages
        in the select box. There shouldn't be any duplicate because of published status.
        """

        class OrganizationsByCategoryPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = OrganizationsByCategoryPluginModel
                fields = ["page"]

        category = CategoryFactory(should_publish=True)
        PageFactory(title__title="other page", should_publish=True)

        plugin_form = OrganizationsByCategoryPluginModelForm()
        rendered_form = plugin_form.as_table()

        self.assertEqual(rendered_form.count(category.extended_object.get_title()), 1)
        self.assertNotIn("other", plugin_form.as_table())

    def test_cms_plugins_organizations_by_category_render_on_public_page(self):
        """
        The organizations by category plugin should render as expected on a public page.
        """
        # Create a category
        category = CategoryFactory(
            page_title={"en": "category title", "fr": "titre catégorie"}
        )
        category_page = category.extended_object

        # Create organizations
        published_organization = OrganizationFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_categories=[category],
            fill_logo={"original_filename": "logo.jpg"},
            should_publish=True,
        )
        OrganizationFactory(
            page_title={"en": "private title", "fr": "titre privé"},
            fill_categories=[category],
            fill_logo={"original_filename": "logo.jpg"},
        )

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(
            placeholder, OrganizationsByCategoryPlugin, "en", **{"page": category_page}
        )
        add_plugin(
            placeholder, OrganizationsByCategoryPlugin, "fr", **{"page": category_page}
        )

        category_page.publish("en")
        category_page.publish("fr")
        category.refresh_from_db()

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")

        # The plugin should not be visible on the public page before it is published
        category_page.unpublish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # # Republish the plugin
        category_page.publish("en")

        # Now modify the organization to have a draft different from the public version
        title_obj = published_organization.extended_object.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # The organization's name should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertIn(
            '<a href="/en/public-title/" title="public title"',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # The organization's title should be wrapped in a h2
        public_title = (
            published_organization.public_extension.extended_object.get_title()
        )
        self.assertContains(
            response,
            f'<h2 class="organization-glimpse__title" property="name">{public_title:s}</h2>',
            html=True,
        )
        self.assertNotContains(response, "draft")
        self.assertNotContains(response, "private")

        # Organization's logo should be present
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
            '<a href="/fr/titre-public/" title="titre public"',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )
        pattern = (
            r'<div class="organization-glimpse__logo">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x113'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_cms_plugins_organizations_by_category_render_on_draft_page(self):
        """
        The organization plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a category
        category = CategoryFactory(page_title="public category")
        category_page = category.extended_object

        # Create organizations
        organization = OrganizationFactory(
            page_title={"en": "public organization", "fr": "organisation publique"},
            fill_categories=[category],
            fill_logo={"original_filename": "logo.jpg"},
        )
        organization_page = organization.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(
            placeholder, OrganizationsByCategoryPlugin, "en", **{"page": category_page}
        )

        category_page.publish("en")
        category_page.unpublish("en")
        category_page.refresh_from_db()

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The unpublished organization should not be visible on the draft page
        response = self.client.get(url)
        self.assertNotContains(response, "public organization")
        self.assertNotContains(response, "public category")

        # Now publish the category to which the organization is linked
        category_page.publish("en")

        # The unpublished organization should still not be visible
        response = self.client.get(url)
        self.assertNotContains(response, "public organization")
        self.assertNotContains(response, "public category")

        # Now publish the organization and modify it to have a draft different from
        # the public version
        organization_page.publish("en")
        title_obj = organization.extended_object.get_title_obj(language="en")
        title_obj.title = "draft organization"
        title_obj.save()

        # Only the public organization should be visible
        response = self.client.get(url)
        self.assertNotContains(response, "draft organization")
        self.assertContains(response, "public organization")
