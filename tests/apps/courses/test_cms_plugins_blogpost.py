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

    def test_cms_plugins_blogpost_render_on_public_page(self):
        """
        The blogpost plugin should render as expected on a public page.
        """
        # Create an blogpost
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
        blogpost.refresh_from_db()

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
        # The blogpost's name should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertIn(
            '<a href="/en/public-title/" class=" blogpost-glimpse blogpost-glimpse--link " ',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # The blogpost's title should be wrapped in a p
        self.assertContains(
            response,
            '<p class="blogpost-glimpse__title">{:s}</p>'.format(
                blogpost.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertNotContains(response, "draft title")

        # Blogpost's cover should be present
        pattern = (
            r'<div class="blogpost-glimpse__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Publication date should be set by first publication
        self.assertContains(
            response,
            '<p class="blogpost-glimpse__date">Nov. 30, 2019</p>',
            html=True,
        )

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertIn(
            '<a href="/fr/titre-public/" class=" blogpost-glimpse blogpost-glimpse--link " ',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # pylint: disable=no-member
        pattern = (
            r'<div class="blogpost-glimpse__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Publication date should be set by first publication
        self.assertContains(
            response,
            '<p class="blogpost-glimpse__date">30 novembre 2019</p>',
            html=True,
        )

    def test_cms_plugins_blogpost_render_on_draft_page(self):
        """
        The blogpost plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a BlogPost
        blogpost = BlogPostFactory(page_title="public title")
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, BlogPostPlugin, "en", **{"page": blogpost_page})

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The blogpost plugin should still be visible on the draft page
        response = self.client.get(url)
        self.assertContains(response, "public title")

        # Now modify the blogpost to have a draft different from the public version
        title_obj = blogpost_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the blogpost plugin should now be visible
        response = self.client.get(url)
        self.assertContains(response, "draft title")
        self.assertNotContains(response, "public title")

        # Publication date block should be absent
        self.assertNotContains(response, "__date")

    def test_cms_plugins_blogpost_render_template(self):
        """
        The blogpost plugin should render according to variant choice.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create an blogpost
        blogpost = BlogPostFactory(page_title="public title")
        blogpost_page = blogpost.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        # Add blogpost plugin with default template
        add_plugin(placeholder, BlogPostPlugin, "en", page=blogpost_page)

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The blogpost-glimpse default template should not have the small attribute
        response = self.client.get(url)
        self.assertNotContains(response, "blogpost-glimpse__small")

        # Add blogpost plugin with small template
        add_plugin(
            placeholder, BlogPostPlugin, "en", page=blogpost_page, variant="small",
        )

        # The blogpost-glimpse default template should not have the small attribute
        response = self.client.get(url)
        self.assertContains(response, "blogpost-glimpse--small")

    def test_cms_plugins_blogpost_default_variant(self):
        """
        If the variant is not specified on the blogpost pluging, it should render according
        to variant variable eventually present in the context of its container.
        """
        # Create an blogpost
        blogpost = BlogPostFactory(page_title="public title")
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
        request.user = AnonymousUser()
        context = {"current_page": page, "variant": "xxl", "request": request}
        renderer = ContentRenderer(request=request)
        html = renderer.render_plugin(model_instance, context)

        self.assertIn("blogpost-glimpse--xxl", html)
