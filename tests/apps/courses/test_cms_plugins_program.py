# -*- coding: utf-8 -*-
"""
Unit tests for the Program plugin and its model
"""
import re

from django import forms
from django.conf import settings

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
            '<a href="/en/public-title/" class="program-glimpse program-glimpse--link',
            status_code=200,
        )
        # The program's title should be wrapped in a p
        self.assertContains(
            response,
            '<p class="program-glimpse__content__title">{:s}</p>'.format(
                program.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertNotContains(response, "draft title")

        # Program's cover should be present
        pattern = (
            r'<div class="program-glimpse__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a href="/fr/titre-public/" class="program-glimpse program-glimpse--link',
            status_code=200,
        )
        # pylint: disable=no-member
        pattern = (
            r'<div class="program-glimpse__media">'
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

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The program plugin should still be visible on the draft page
        response = self.client.get(url)
        self.assertContains(response, "public title")

        # Now modify the program to have a draft different from the public version
        title_obj = program_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the program plugin should now be visible
        response = self.client.get(url)
        self.assertContains(response, "draft title")
        self.assertNotContains(response, "public title")
