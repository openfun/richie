# -*- coding: utf-8 -*-
"""
Unit tests for the Person plugin and its model
"""
import re

from django import forms
from django.conf import settings

import htmlmin
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
        self.assertContains(response, '<a href="/en/person-title/">', status_code=200)
        # The person's full name should be wrapped in a h2
        person_title = person.public_extension.extended_object.get_title()
        self.assertContains(
            response,
            f'<h2 class="person-glimpse__title">{person_title:s}</h2>',
            html=True,
        )
        self.assertContains(response, "person title")
        self.assertNotContains(response, "Jiji")

        # Person's portrait should be present
        href = person_page.get_absolute_url()
        pattern = (
            rf'<a class="person-glimpse__media" href="{href:s}" tabindex="-1" aria-hidden="true" '
            r'property="url">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*portrait\.jpg__200x200'
            r'.*alt="" property="image"'
        )
        content = (
            htmlmin.minify(
                response.content.decode("UTF-8"),
                reduce_empty_attributes=False,
                remove_optional_attribute_quotes=False,
            ),
        )
        self.assertIsNotNone(re.search(pattern, str(content)))

        # Short bio should be present
        self.assertContains(
            response,
            '<div class="person-glimpse__bio" property="description">public bio</div>',
            html=True,
        )
        self.assertNotContains(response, "draft bio")

        # RDFa markup should be present
        self.assertContains(
            response,
            '<meta property="name" content="person title" />'
            f'<meta property="url" content="http://example.com{href}" />',
            html=True,
        )

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(response, '<a href="/fr/titre-personne/">', status_code=200)

        href = person_page.get_absolute_url()
        pattern = (
            rf'<a class="person-glimpse__media" href="{href:s}" tabindex="-1" aria-hidden="true" '
            r'property="url">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*portrait\.jpg__200x200'
            r'.*alt="" property="image"'
        )
        content = (
            htmlmin.minify(
                response.content.decode("UTF-8"),
                reduce_empty_attributes=False,
                remove_optional_attribute_quotes=False,
            ),
        )
        self.assertIsNotNone(re.search(pattern, str(content)))

        self.assertContains(
            response,
            '<div class="person-glimpse__bio" property="description">résumé public</div>',
            html=True,
        )

        # RDFa markup should be present
        self.assertContains(
            response,
            '<meta property="name" content="titre personne" />'
            f'<meta property="url" content="http://example.com{href}" />',
            html=True,
        )

    def test_cms_plugins_person_render_on_public_page_custom_bio(self):
        """
        It should be possible to override the person's bio on the glimpse rendered by the plugin.
        """
        # Create a Person
        person = PersonFactory(
            page_title={"en": "person title", "fr": "titre personne"},
            should_publish=True,
        )

        # Add bio to related placeholder
        bio_placeholder = person.extended_object.placeholders.get(slot="bio")
        add_plugin(
            bio_placeholder, PlainTextPlugin, "en", **{"body": "original public bio"}
        )
        add_plugin(
            bio_placeholder,
            PlainTextPlugin,
            "fr",
            **{"body": "résumé public d'origine"},
        )

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(
            placeholder,
            PersonPlugin,
            "en",
            **{"page": person.extended_object, "bio": "custom public bio"},
        )
        add_plugin(
            placeholder,
            PersonPlugin,
            "fr",
            **{"page": person.extended_object, "bio": "résumé public modifié"},
        )
        page.publish("en")
        page.publish("fr")

        # The custom bio should be present on the glimpse and not the original bio

        # Check the page content in English
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertContains(response, "custom public bio", status_code=200)
        self.assertNotContains(response, "origine")

        # Check the page content in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)

        self.assertContains(response, "résumé public modifié", status_code=200)
        self.assertNotContains(response, "original")

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

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The unpublished category plugin should not be visible on the draft page
        response = self.client.get(url)
        self.assertNotContains(response, "person title")
        self.assertNotContains(response, "public bio")

        # Now publish the category and modify it to have a draft different from the
        # public version
        person_page.publish("en")
        person_title = person.extended_object.title_set.get(language="en")
        person_title.title = "Jiji"
        person_title.save()
        bio_en.body = "draft bio"
        bio_en.save()

        # The draft version of the person plugin should now be visible
        response = self.client.get(url)
        self.assertNotContains(response, "Jiji")
        self.assertNotContains(response, "draft bio")
        self.assertContains(response, "person title")
        self.assertContains(response, "public bio")

    def test_cms_plugins_person_fallback_when_never_published(self):
        """
        The person plugin should render in the fallback language when the person
        page has never been published in the current language.
        """
        # Create a person
        person = PersonFactory(
            page_title={"en": "public person", "fr": "personne publique"},
            fill_portrait={
                "original_filename": "portrait.jpg",
                "default_alt_text": "my portrait",
            },
        )
        person_page = person.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, PersonPlugin, "en", **{"page": person_page})
        add_plugin(placeholder, PersonPlugin, "fr", **{"page": person_page})

        # Publish only the French version of the person
        person_page.publish("fr")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        # Person's name should be present as a link to the cms page
        self.assertContains(
            response, '<a href="/en/personne-publique/">', status_code=200
        )
        # The person's full name should be wrapped in a h2
        self.assertContains(
            response,
            '<h2 class="person-glimpse__title">personne publique</h2>',
            html=True,
        )
        self.assertNotContains(response, "public person")

        # Person's portrait should be present
        pattern = (
            r'<a class="person-glimpse__media" href="/en/personne-publique/" '
            r'tabindex="-1" aria-hidden="true" property="url">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*portrait\.jpg__200x200'
            r'.*alt="" property="image"'
        )
        content = (
            htmlmin.minify(
                response.content.decode("UTF-8"),
                reduce_empty_attributes=False,
                remove_optional_attribute_quotes=False,
            ),
        )
        self.assertIsNotNone(re.search(pattern, str(content)))

    def test_cms_plugins_person_fallback_when_published_unpublished(self):
        """
        The person plugin should not render when the person was voluntarily
        unpublished in the current language.
        """
        # Create a person
        person = PersonFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_portrait={
                "original_filename": "portrait.jpg",
                "default_alt_text": "my portrait",
            },
        )
        person_page = person.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, PersonPlugin, "en", **{"page": person_page})
        add_plugin(placeholder, PersonPlugin, "fr", **{"page": person_page})

        # Publish only the French version of the person
        person_page.publish("fr")
        person_page.publish("en")
        person_page.unpublish("en")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertNotContains(response, "glimpse")
