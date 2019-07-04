# -*- coding: utf-8 -*-
"""
Unit tests for the Person plugin and its model
"""
import re

from django import forms
from django.conf import settings

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import PersonPlugin
from richie.apps.courses.factories import PersonFactory
from richie.apps.courses.models import PersonPluginModel
from richie.plugins.plain_text.cms_plugins import PlainTextPlugin


class PersonPluginTestCase(CMSTestCase):
    """
    Test that PersonPlugin correctly displays a Person's page placeholders content
    """

    def test_cms_plugins_person_form_page_choices(self):
        """
        The form to create a person plugin should only list person pages in the select box.
        """

        class PersonPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = PersonPluginModel
                fields = ["page"]

        person = PersonFactory()
        other_page_title = "other page"
        create_page(
            other_page_title, "richie/single_column.html", settings.LANGUAGE_CODE
        )
        plugin_form = PersonPluginModelForm()
        self.assertIn(person.extended_object.get_title(), plugin_form.as_table())
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_person_render_on_public_page(self):
        """
        The person plugin should render as expected on a public page.
        """
        # Create a Person
        person = PersonFactory(
            page_title={"en": "person title", "fr": "titre personne"},
            fill_portrait={
                "original_filename": "portrait.jpg",
                "default_alt_text": "my portrait",
            },
        )
        person_page = person.extended_object

        # Add bio to related placeholder
        bio_placeholder = person_page.placeholders.get(slot="bio")
        bio_en = add_plugin(
            bio_placeholder, PlainTextPlugin, "en", **{"body": "public bio"}
        )
        add_plugin(bio_placeholder, PlainTextPlugin, "fr", **{"body": "résumé public"})

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, PersonPlugin, "en", **{"page": person.extended_object})
        add_plugin(placeholder, PersonPlugin, "fr", **{"page": person.extended_object})

        person_page.publish("en")
        person_page.publish("fr")
        person.refresh_from_db()

        page.publish("en")
        page.publish("fr")

        url = page.get_absolute_url(language="en")

        # The person plugin should not be visible on the public page before it is published
        person_page.unpublish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "person title")

        # Republishing the plugin should not make it public
        person_page.publish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "person title")

        # Now modify the person to have a draft different from the public version
        person_title = person.extended_object.title_set.get(language="en")
        person_title.title = "Jiji"
        person_title.save()
        bio_en.body = "draft bio"
        bio_en.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # Person's name should be present as a link to the cms page
        self.assertContains(
            response,
            '<a href="/en/person-title/">'.format(
                name=person.public_extension.extended_object.get_title()
            ),
            status_code=200,
        )
        # The person's full name should be wrapped in a h2
        self.assertContains(
            response,
            '<h2 class="person-glimpse__content__wrapper__title">{:s}</h2>'.format(
                person.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertContains(response, "person title")
        self.assertNotContains(response, "Jiji")

        # Person's portrait should be present
        pattern = (
            r'<a class="person-glimpse__media" href="{href:s}" tabindex="-1" aria-hidden="true">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*portrait\.jpg__200x200'
            r'.*alt=""'
        ).format(href=person_page.get_absolute_url())
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # Short bio should be present
        self.assertContains(
            response,
            '<div class="person-glimpse__content__wrapper__bio">public bio</div>',
            html=True,
        )
        self.assertNotContains(response, "draft bio")

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(response, '<a href="/fr/titre-personne/">', status_code=200)
        pattern = (
            r'<a class="person-glimpse__media" href="{href:s}" tabindex="-1" aria-hidden="true">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*portrait\.jpg__200x200'
            r'.*alt=""'
        ).format(href=person_page.get_absolute_url())
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        self.assertContains(
            response,
            '<div class="person-glimpse__content__wrapper__bio">résumé public</div>',
            html=True,
        )

    def test_cms_plugins_person_render_on_draft_page(self):
        """
        The person plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Person
        person = PersonFactory(
            page_title={"en": "person title", "fr": "titre personne"}
        )
        person_page = person.extended_object

        # Add bio to related placeholder
        bio_placeholder = person_page.placeholders.get(slot="bio")
        bio_en = add_plugin(
            bio_placeholder, PlainTextPlugin, "en", **{"body": "public bio"}
        )

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, PersonPlugin, "en", **{"page": person.extended_object})

        person_page.publish("en")
        person_page.unpublish("en")

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The person plugin should still be visible on the draft page
        response = self.client.get(url)
        self.assertContains(response, "person title")
        self.assertContains(response, "public bio")

        # Now modify the person to have a draft different from the public version
        person_title = person.extended_object.title_set.get(language="en")
        person_title.title = "Jiji"
        person_title.save()
        bio_en.body = "draft bio"
        bio_en.save()

        # The draft version of the person plugin should now be visible
        response = self.client.get(url)
        self.assertContains(response, "Jiji")
        self.assertContains(response, "draft bio")
        self.assertNotContains(response, "person_title")
        self.assertNotContains(response, "public bio")
