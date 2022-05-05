# -*- coding: utf-8 -*-
"""
Unit tests for the BlogPost plugin and its model
"""
import re
from datetime import datetime
from unittest import mock

from django import forms
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.test.client import RequestFactory
from django.utils import timezone

import lxml.html
from cms.api import add_plugin, create_page
from cms.plugin_rendering import ContentRenderer
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import BlogPostPlugin
from richie.apps.courses.factories import BlogPostFactory
from richie.apps.courses.models import BlogPostPluginModel


class BlogPostPluginTestCase(CMSTestCase):
    """
    Test that BlogPostPlugin correctly displays a BlogPost's page placeholders content
    """

    def test_cms_plugins_blogpost_form_page_choices(self):
        """
        The form to create a blogpost plugin should only list blogpost pages
        in the select box.
        """

        class BlogPostPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = BlogPostPluginModel
                fields = ["page"]

        blog_page = create_i18n_page("my title", published=True)
        blogpost = BlogPostFactory(page_parent=blog_page)
        other_page_title = "other page"
        create_page(
            other_page_title, "richie/single_column.html", settings.LANGUAGE_CODE
        )
        plugin_form = BlogPostPluginModelForm()
        rendered_form = plugin_form.as_table()
        self.assertEqual(rendered_form.count(blogpost.extended_object.get_title()), 1)
        self.assertNotIn(other_page_title, plugin_form.as_table())

    # pylint: disable=too-many-statements
    def test_cms_plugins_blogpost_render_on_public_page(self):
        """
        The blogpost plugin should render as expected on a public page.
        """
        # Create a blogpost
        blogpost = BlogPostFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
        )
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, BlogPostPlugin, "en", **{"page": blogpost_page})
        add_plugin(placeholder, BlogPostPlugin, "fr", **{"page": blogpost_page})

        with mock.patch(
            "cms.models.pagemodel.now",
            return_value=datetime(2019, 11, 30, tzinfo=timezone.utc),
        ):
            blogpost_page.publish("en")

        blogpost_page.publish("fr")

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")

        # The blogpost plugin should not be visible on the public page before it is published
        blogpost_page.unpublish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # # Republish the plugin
        blogpost_page.publish("en")

        # Now modify the blogpost to have a draft different from the public version
        title_obj = blogpost_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        html = lxml.html.fromstring(response.content)

        # The blogpost's name should be present as a link to the cms page, wrapped in a h2
        title = html.cssselect("h2.blogpost-glimpse__title")[0]
        link = title.cssselect(".blogpost-glimpse__link")[0]
        self.assertEqual(link.get("href"), "/en/public-title/")
        blogpost.refresh_from_db()
        blogpost_title = blogpost.public_extension.extended_object.get_title()
        self.assertEqual(link.text_content().strip(), blogpost_title)
        self.assertNotContains(response, "draft title")

        # Blogpost's cover should be present
        pattern = (
            r'<div class="blogpost-glimpse__media" aria-hidden="true">'
            r'<a href="/en/public-title/" tabindex="-1">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Publication date should be set by first publication
        date = html.cssselect(".blogpost-glimpse__date")[0]
        # the visible date is actually only here for sighted users, make sure it is
        # hidden from screen readers
        self.assertEqual(date.text_content().strip(), "Nov. 30, 2019")
        self.assertEqual(date.get("aria-hidden"), "true")
        # and make sure there is a screen reader-only date
        screen_reader_date = html.cssselect('[data-testid="offscreen-date"]')[0]
        self.assertEqual(screen_reader_date.text_content().strip(), "Nov. 30, 2019")
        self.assertEqual(screen_reader_date.get("class"), "offscreen")

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        html = lxml.html.fromstring(response.content)

        title = html.cssselect("h2.blogpost-glimpse__title")[0]
        link = title.cssselect(".blogpost-glimpse__link")[0]
        self.assertEqual(link.get("href"), "/fr/titre-public/")

        # pylint: disable=no-member
        pattern = (
            r'<div class="blogpost-glimpse__media" aria-hidden="true">'
            r'<a href="/fr/titre-public/" tabindex="-1">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Publication date should be set by first publication
        date = html.cssselect(".blogpost-glimpse__date")[0]
        # the visible date is actually only here for sighted users, make sure it is
        # hidden from screen readers
        self.assertEqual(date.text_content().strip(), "30 novembre 2019")
        self.assertEqual(date.get("aria-hidden"), "true")
        # and make sure there is a screen reader-only date
        screen_reader_date = html.cssselect('[data-testid="offscreen-date"]')[0]
        self.assertEqual(screen_reader_date.text_content().strip(), "30 novembre 2019")
        self.assertEqual(screen_reader_date.get("class"), "offscreen")

    def test_cms_plugins_blogpost_fallback_when_never_published(self):
        """
        The blogpost plugin should render in the fallback language when the blogpost
        page has never been published in the current language.
        """
        # Create a blogpost
        blogpost = BlogPostFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
        )
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, BlogPostPlugin, "en", **{"page": blogpost_page})
        add_plugin(placeholder, BlogPostPlugin, "fr", **{"page": blogpost_page})

        # Publish only the French version of the blog post
        with mock.patch(
            "cms.models.pagemodel.now",
            return_value=datetime(2019, 11, 30, tzinfo=timezone.utc),
        ):
            blogpost_page.publish("fr")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        html = lxml.html.fromstring(response.content)

        # The english blogpost's name should be present as a link wrapped
        # in a h2 to the cms page, but the locale in the url should remain "en"
        title = html.cssselect("h2.blogpost-glimpse__title")[0]
        link = title.cssselect(".blogpost-glimpse__link")[0]
        self.assertEqual(link.text_content().strip(), "titre public")
        self.assertEqual(link.get("href"), "/en/titre-public/")

        self.assertNotContains(response, "public title")

        # Blogpost's cover should be present
        pattern = (
            r'<div class="blogpost-glimpse__media" aria-hidden="true">'
            r'<a href="/en/titre-public/" tabindex="-1">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Publication date should be set by first publication
        date = html.cssselect(".blogpost-glimpse__date")[0]
        # the visible date is actually only here for sighted users, make sure it is
        # hidden from screen readers
        self.assertEqual(date.text_content().strip(), "Nov. 30, 2019")
        self.assertEqual(date.get("aria-hidden"), "true")
        # and make sure there is a screen reader-only date
        screen_reader_date = html.cssselect('[data-testid="offscreen-date"]')[0]
        self.assertEqual(screen_reader_date.text_content().strip(), "Nov. 30, 2019")
        self.assertEqual(screen_reader_date.get("class"), "offscreen")

    def test_cms_plugins_blogpost_fallback_when_published_unpublished(self):
        """
        The blogpost plugin should not render when the blogpost was voluntarily
        unpublished in the current language.
        """
        # Create a blogpost
        blogpost = BlogPostFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
        )
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, BlogPostPlugin, "en", **{"page": blogpost_page})
        add_plugin(placeholder, BlogPostPlugin, "fr", **{"page": blogpost_page})

        # Publish only the French version of the blog post
        with mock.patch(
            "cms.models.pagemodel.now",
            return_value=datetime(2019, 11, 30, tzinfo=timezone.utc),
        ):
            blogpost_page.publish("fr")

        blogpost_page.publish("en")
        blogpost_page.unpublish("en")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertNotContains(response, "glimpse")

    def test_cms_plugins_blogpost_render_on_draft_page(self):
        """
        The blogpost plugin should render its public version on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a BlogPost
        blogpost = BlogPostFactory(page_title="public title", should_publish=True)
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, BlogPostPlugin, "en", **{"page": blogpost_page})

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The blogpost plugin should still be visible on the draft page
        response = self.client.get(url)
        self.assertContains(response, "public title")

        # Now modify the blogpost to have a draft different from the public version
        title_obj = blogpost_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The public version of the blogpost plugin should still be visible
        response = self.client.get(url)
        self.assertNotContains(response, "draft title")
        self.assertContains(response, "public title")

        # Publication date block should be absent
        self.assertContains(response, "__date")

    def test_cms_plugins_blogpost_render_template(self):
        """
        The blogpost plugin should render according to variant choice.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create an blogpost
        blogpost = BlogPostFactory(page_title="public title", should_publish=True)
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        # Add blogpost plugin with default template
        add_plugin(placeholder, BlogPostPlugin, "en", page=blogpost_page)

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The blogpost-glimpse default variant should be glimpse
        response = self.client.get(url)
        self.assertContains(response, "blogpost-glimpse")

        # Add blogpost plugin with small variant
        add_plugin(
            placeholder, BlogPostPlugin, "en", page=blogpost_page, variant="small"
        )

        # The blogpost-glimpse default template should not have the small attribute
        response = self.client.get(url)
        self.assertContains(response, "blogpost-small")

    def test_cms_plugins_blogpost_default_variant(self):
        """
        If the variant is specified on the blogpost plugin and also as variant
        variable in the context of its container, the instance variable should
        be used.
        """
        # Create an blogpost
        blogpost = BlogPostFactory(page_title="public title", should_publish=True)
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        # Add blogpost plugin with default template
        model_instance = add_plugin(
            placeholder, BlogPostPlugin, "en", page=blogpost_page, variant="small"
        )

        # Get generated html
        request = RequestFactory()
        request.current_page = page
        request.path_info = "/en/my-path/"
        request.user = AnonymousUser()
        context = {"current_page": page, "blogpost_variant": "xxl", "request": request}
        renderer = ContentRenderer(request=request)
        html = renderer.render_plugin(model_instance, context)

        self.assertIn("blogpost-small", html)

    def test_cms_plugins_blogpost_cascade_variant(self):
        """
        If the variant is not specified on the blogpost plugin, it should render
        according to variant variable eventually present in the context of its
        container.
        """
        # Create an blogpost
        blogpost = BlogPostFactory(page_title="public title", should_publish=True)
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        # Add blogpost plugin with default template
        model_instance = add_plugin(
            placeholder, BlogPostPlugin, "en", page=blogpost_page
        )

        # Get generated html
        request = RequestFactory()
        request.current_page = page
        request.path_info = "/en/my-path/"
        request.user = AnonymousUser()
        context = {"current_page": page, "blogpost_variant": "xxl", "request": request}
        renderer = ContentRenderer(request=request)
        html = renderer.render_plugin(model_instance, context)

        self.assertIn("blogpost-xxl", html)
