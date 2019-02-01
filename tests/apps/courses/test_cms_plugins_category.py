# -*- coding: utf-8 -*-
"""
Unit tests for the category plugin and its model
"""
from django import forms
from django.conf import settings

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from djangocms_picture.cms_plugins import PicturePlugin

from richie.apps.core.factories import FilerImageFactory, UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.factories import CategoryFactory
from richie.apps.courses.models import CategoryPluginModel


class CategoryPluginTestCase(CMSTestCase):
    """
    Test that CategoryPlugin correctly displays a Category's page placeholders content
    """

    def test_cms_plugins_category_form_page_choices(self):
        """
        The form to create a category plugin should only list category pages in the select box.
        """

        class CategoryPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = CategoryPluginModel
                fields = ["page"]

        category = CategoryFactory()
        other_page_title = "other page"
        create_page(other_page_title, "richie/fullwidth.html", settings.LANGUAGE_CODE)
        plugin_form = CategoryPluginModelForm()
        self.assertIn(category.extended_object.get_title(), plugin_form.as_table())
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_category_render_on_public_page(self):
        """
        The category plugin should render as expected on a public page.
        """
        # Create a filer fake image
        image = FilerImageFactory()

        # Create a Category
        category = CategoryFactory(
            page_title={"en": "public title", "fr": "titre publique"}
        )
        category_page = category.extended_object

        # Add logo to related placeholder
        logo_placeholder = category_page.placeholders.get(slot="logo")
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
        add_plugin(placeholder, CategoryPlugin, "en", **{"page": category_page})
        add_plugin(placeholder, CategoryPlugin, "fr", **{"page": category_page})

        category_page.publish("en")
        category_page.publish("fr")
        category.refresh_from_db()

        page.publish("en")
        page.publish("fr")

        url = page.get_absolute_url(language="en")

        # The category plugin should not be visible on the public page before it is published
        category_page.unpublish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # Republish the plugin
        category_page.publish("en")

        # Now modify the category to have a draft different from the public version
        title_obj = category_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # Category's title should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertContains(
            response,
            '<a class="category-plugin__body" href="/en/public-title/" title="{title:s}"'.format(
                title=category.public_extension.extended_object.get_title()
            ),
            status_code=200,
        )
        # The category's title should be wrapped in a div
        self.assertContains(
            response,
            '<div class="category-plugin__title">{:s}</div>'.format(
                category.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertNotContains(response, "draft title")

        # Category's logo should be present
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a class="category-plugin__body" href="/fr/titre-publique/" title="{title:s}"'.format(
                title=category.public_extension.extended_object.get_title()
            ),
            status_code=200,
        )
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)

    def test_cms_plugins_category_render_on_draft_page(self):
        """
        The category plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Category
        category = CategoryFactory(page_title="public title")
        category_page = category.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CategoryPlugin, "en", **{"page": category_page})

        category_page.publish("en")
        category_page.unpublish("en")

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The category plugin should still be visible on the draft page
        response = self.client.get(url)
        self.assertContains(response, "public title")

        # Now modify the category to have a draft different from the public version
        title_obj = category_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the category plugin should now be visible
        response = self.client.get(url)
        self.assertContains(response, "draft title")
        self.assertNotContains(response, "public title")
