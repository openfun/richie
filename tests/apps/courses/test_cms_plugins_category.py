# -*- coding: utf-8 -*-
"""
Unit tests for the category plugin and its model
"""
import re
from datetime import datetime
from unittest import mock

from django import forms
from django.conf import settings
from django.test.utils import override_settings
from django.utils import timezone

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.factories import CategoryFactory
from richie.apps.courses.models import CategoryPluginModel


class CategoryPluginTestCase(CMSTestCase):
    """
    Test that CategoryPlugin correctly displays a Category's page placeholders content
    """

    @override_settings(LIMIT_PLUGIN_CATEGORIES_TO_LEAF=True)
    def test_cms_plugins_category_form_page_choices_leaf_only(self):
        """
        The form to create a category plugin should only list leaf category pages in the
        select box when the setting is activated. There shouldn't be any duplicate because
        of published status.
        """

        class CategoryPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = CategoryPluginModel
                fields = ["page"]

        meta_category = CategoryFactory(should_publish=True)
        parent_category = CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        leaf_category = CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        other_page_title = "other page"
        create_page(
            other_page_title, "richie/single_column.html", settings.LANGUAGE_CODE
        )

        plugin_form = CategoryPluginModelForm()
        rendered_form = plugin_form.as_table()

        self.assertEqual(
            rendered_form.count(leaf_category.extended_object.get_title()), 1
        )
        self.assertNotIn(parent_category.extended_object.get_title(), rendered_form)
        self.assertNotIn(meta_category.extended_object.get_title(), rendered_form)
        self.assertNotIn(other_page_title, rendered_form)

    def test_cms_plugins_category_form_page_choices_all_categories(self):
        """
        By default, all categories can be linked via a plugin excluding meta categories.
        There shouldn't be any duplicate because of published status.
        """

        class CategoryPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = CategoryPluginModel
                fields = ["page"]

        meta_category = CategoryFactory(should_publish=True)
        parent_category = CategoryFactory(
            page_parent=meta_category.extended_object, should_publish=True
        )
        leaf_category = CategoryFactory(
            page_parent=parent_category.extended_object, should_publish=True
        )

        other_page_title = "other page"
        create_page(
            other_page_title, "richie/single_column.html", settings.LANGUAGE_CODE
        )

        plugin_form = CategoryPluginModelForm()
        rendered_form = plugin_form.as_table()

        self.assertEqual(
            rendered_form.count(leaf_category.extended_object.get_title()), 1
        )
        self.assertEqual(
            rendered_form.count(parent_category.extended_object.get_title()), 1
        )
        self.assertNotIn(meta_category.extended_object.get_title(), rendered_form)
        self.assertNotIn(other_page_title, rendered_form)

    def test_cms_plugins_category_render_on_public_page(self):
        """
        The category plugin should render as expected on a public page.
        """
        # Create a Category
        category = CategoryFactory(
            page_title={"en": "public title", "fr": "titre publique"},
            fill_logo={"original_filename": "logo.jpg", "default_alt_text": "my logo"},
        )
        category_page = category.extended_object

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
            '<a class="category-glimpse" href="/en/public-title/"',
            status_code=200,
        )
        # The category's title should be wrapped in a div
        self.assertContains(
            response,
            # pylint: disable=consider-using-f-string
            '<h2 class="category-glimpse__title">{:s}</h2>'.format(
                category.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertNotContains(response, "draft title")

        # Category's logo should be present
        pattern = (
            r'<div class="category-glimpse__logo">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x200'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a class="category-glimpse" href="/fr/titre-publique/"',
            status_code=200,
        )
        pattern = (
            r'<div class="category-glimpse__logo">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x200'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

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

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The unpublished category plugin should not be visible on the draft page
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # Now publish the category and modify it to have a draft different from the
        # public version
        category_page.publish("en")
        title_obj = category_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the category plugin should not be visible
        response = self.client.get(url)
        self.assertNotContains(response, "draft title")
        self.assertContains(response, "public title")

    def test_cms_plugins_category_fallback_when_never_published(self):
        """
        The category plugin should render in the fallback language when the category
        page has never been published in the current language.
        """
        # Create a category
        category = CategoryFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_logo={"original_filename": "logo.jpg", "default_alt_text": "my logo"},
        )
        category_page = category.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CategoryPlugin, "en", **{"page": category_page})
        add_plugin(placeholder, CategoryPlugin, "fr", **{"page": category_page})

        # Publish only the French version of the category
        category_page.publish("fr")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        # The english category's name should be present as a link to the cms page
        # But the locale in the url should remain "en"
        self.assertIn(
            '<a class="category-glimpse" href="/en/titre-public/"',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # The category's title should be wrapped in a p
        category.refresh_from_db()
        self.assertContains(
            response,
            '<h2 class="category-glimpse__title">titre public</h2>',
            html=True,
        )
        self.assertNotContains(response, "public title")

        # category's cover should be present
        pattern = (
            r'<div class="category-glimpse__logo">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x200'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_cms_plugins_category_fallback_when_published_unpublished(self):
        """
        The category plugin should not render when the category was voluntarily
        unpublished in the current language.
        """
        # Create a category
        category = CategoryFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_logo={"original_filename": "logo.jpg", "default_alt_text": "my logo"},
        )
        category_page = category.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CategoryPlugin, "en", **{"page": category_page})
        add_plugin(placeholder, CategoryPlugin, "fr", **{"page": category_page})

        # Publish only the French version of the category
        with mock.patch(
            "cms.models.pagemodel.now",
            return_value=datetime(2019, 11, 30, tzinfo=timezone.utc),
        ):
            category_page.publish("fr")

        category_page.publish("en")
        category_page.unpublish("en")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertNotContains(response, "glimpse")
