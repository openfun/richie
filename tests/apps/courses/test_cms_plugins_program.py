# -*- coding: utf-8 -*-
"""
Unit tests for the Program plugin and its model
"""
import re

from django import forms
from django.conf import settings

import lxml.html
from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import ProgramPlugin
from richie.apps.courses.factories import ProgramFactory
from richie.apps.courses.models import ProgramPluginModel


class ProgramPluginTestCase(CMSTestCase):
    """
    Test that ProgramPlugin correctly displays a Program's page placeholders content
    """

    def test_cms_plugins_program_form_page_choices(self):
        """
        The form to create a program plugin should only list program pages
        in the select box.
        """

        class ProgramPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = ProgramPluginModel
                fields = ["page"]

        program_page = create_i18n_page("my title", published=True)
        program = ProgramFactory(page_parent=program_page)
        other_page_title = "other page"
        create_page(
            other_page_title, "richie/single_column.html", settings.LANGUAGE_CODE
        )
        plugin_form = ProgramPluginModelForm()
        rendered_form = plugin_form.as_table()
        self.assertEqual(rendered_form.count(program.extended_object.get_title()), 1)
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_program_render_on_public_page(self):
        """
        The program plugin should render as expected on a public page.
        """
        # Create an program
        program = ProgramFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
        )
        program_page = program.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, ProgramPlugin, "en", **{"page": program_page})
        add_plugin(placeholder, ProgramPlugin, "fr", **{"page": program_page})

        program_page.publish("en")
        program_page.publish("fr")
        program.refresh_from_db()

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")

        # The program plugin should not be visible on the public page before it is published
        program_page.unpublish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # # Republish the plugin
        program_page.publish("en")

        # Now modify the program to have a draft different from the public version
        title_obj = program_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # The program's name should be present as a link to the cms page
        self.assertContains(
            response,
            '<a href="/en/public-title/" class="program-glimpse__link',
            status_code=200,
        )
        # The program's title should be wrapped in a h2
        pattern = r'<h2 class="program-glimpse__title">.*public title.*</h2>'
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertNotContains(response, "draft title")

        # Program's cover should be present
        pattern = (
            r'<div class="program-glimpse__media" aria-hidden="true">'
            r'<a class="program-glimpse__stretched-link" tabindex="-1" href="/en/public-title/">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a href="/fr/titre-public/" class="program-glimpse__link',
            status_code=200,
        )
        pattern = r'<h2 class="program-glimpse__title">.*titre public.*</h2>'
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        # pylint: disable=no-member
        pattern = (
            r'<div class="program-glimpse__media" aria-hidden="true">'
            r'<a class="program-glimpse__stretched-link" tabindex="-1" href="/fr/titre-public/">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_cms_plugins_program_render_on_draft_page(self):
        """
        The program plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Program
        program = ProgramFactory(page_title="public title")
        program_page = program.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, ProgramPlugin, "en", **{"page": program_page})

        program_page.publish("en")
        program_page.unpublish("en")
        program_page.refresh_from_db()

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The unpublished program plugin should not be visible on the draft page
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # Now publish the program and modify it to have a draft different from the
        # public version
        program_page.publish("en")
        title_obj = program_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the program plugin should now be visible
        response = self.client.get(url)
        self.assertNotContains(response, "draft title")
        self.assertContains(response, "public title")

    def test_cms_plugins_program_fallback_when_never_published(self):
        """
        The program plugin should render in the fallback language when the program
        page has never been published in the current language.
        """
        # Create a program
        program = ProgramFactory(
            page_title={"en": "public program", "fr": "programme publique"},
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
        )
        program_page = program.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, ProgramPlugin, "en", **{"page": program_page})
        add_plugin(placeholder, ProgramPlugin, "fr", **{"page": program_page})

        # Publish only the French version of the program
        program_page.publish("fr")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        html = lxml.html.fromstring(response.content)

        # The program's full name should be wrapped in a link within an h2
        title = html.cssselect(".program-glimpse__title")[0]
        link = title.cssselect(".program-glimpse__link")[0]
        self.assertEqual(link.text_content().strip(), "programme publique")
        self.assertNotContains(response, "public program")

        # Program's cover should be present
        cover = html.cssselect(".program-glimpse__media")[0]
        self.assertEqual(cover.get("aria-hidden"), "true")
        img = cover.cssselect("img")[0]
        self.assertIsNotNone(
            re.search(
                r"/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170",
                img.get("src"),
            )
        )

    def test_cms_plugins_program_fallback_when_published_unpublished(self):
        """
        The program plugin should not render when the program was voluntarily
        unpublished in the current language.
        """
        # Create a program
        program = ProgramFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
        )
        program_page = program.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, ProgramPlugin, "en", **{"page": program_page})
        add_plugin(placeholder, ProgramPlugin, "fr", **{"page": program_page})

        # Publish only the French version of the program
        program_page.publish("fr")
        program_page.publish("en")
        program_page.unpublish("en")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertNotContains(response, "glimpse")
