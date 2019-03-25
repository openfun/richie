# -*- coding: utf-8 -*-
"""
Unit tests for the Person plugin and its model
"""
from django import forms
from django.conf import settings

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from djangocms_picture.cms_plugins import PicturePlugin

from richie.apps.core.factories import FilerImageFactory, UserFactory
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
        create_page(other_page_title, "richie/fullwidth.html", settings.LANGUAGE_CODE)
        plugin_form = PersonPluginModelForm()
        self.assertIn(person.get_full_name(), plugin_form.as_table())
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_person_render_on_public_page(self):
        """
        The person plugin should render as expected on a public page.
        """
        # Create a filer fake image
        image = FilerImageFactory()

        # Create a Person
        person = PersonFactory(
            page_title={"en": "person title", "fr": "titre personne"},
            first_name="Meimei",
        )
        person_page = person.extended_object

        # Add portrait to related placeholder
        portrait_placeholder = person_page.placeholders.get(slot="portrait")
        add_plugin(
            portrait_placeholder,
            PicturePlugin,
            "en",
            **{"picture": image, "attributes": {"alt": "portrait description"}}
        )
        add_plugin(
            portrait_placeholder,
            PicturePlugin,
            "fr",
            **{"picture": image, "attributes": {"alt": "description du portrait"}}
        )
        # Add resume to related placeholder
        resume_placeholder = person_page.placeholders.get(slot="resume")
        resume_en = add_plugin(
            resume_placeholder, PlainTextPlugin, "en", **{"body": "public resume"}
        )
        add_plugin(
            resume_placeholder, PlainTextPlugin, "fr", **{"body": "résumé public"}
        )

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
        self.assertNotContains(response, "Meimei")

        # Republishing the plugin should not make it public
        person_page.publish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "Meimei")

        # Now modify the person to have a draft different from the public version
        person.first_name = "Jiji"
        person.save()
        resume_en.body = "draft resume"
        resume_en.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # Person's name should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertContains(
            response,
            '<a href="/en/person-title/" title="{name:s}">'.format(
                name=person.public_extension.get_full_name()
            ),
            status_code=200,
        )
        # The person's full name should be wrapped in a h2
        self.assertContains(
            response,
            '<h2 class="person-plugin__content__title">{:s}</h2>'.format(
                person.public_extension.get_full_name()
            ),
            html=True,
        )
        self.assertContains(response, "Meimei")
        self.assertNotContains(response, "Jiji")

        # Person's portrait and its properties should be present
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)

        # Short resume should be present
        self.assertContains(
            response,
            '<div class="person-plugin__content__text">public resume</div>',
            html=True,
        )
        self.assertNotContains(response, "draft resume")

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a href="/fr/titre-personne/" title="{name:s}">'.format(
                name=person.public_extension.get_full_name()
            ),
            status_code=200,
        )
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)
        self.assertContains(
            response,
            '<div class="person-plugin__content__text">résumé public</div>',
            html=True,
        )

    def test_cms_plugins_person_render_on_draft_page(self):
        """
        The person plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Person
        person = PersonFactory(first_name="Meimei")
        person_page = person.extended_object

        # Add resume to related placeholder
        resume_placeholder = person_page.placeholders.get(slot="resume")
        resume_en = add_plugin(
            resume_placeholder, PlainTextPlugin, "en", **{"body": "public resume"}
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
        self.assertContains(response, "Meimei")
        self.assertContains(response, "public resume")

        # Now modify the person to have a draft different from the public version
        person.first_name = "Jiji"
        person.save()
        resume_en.body = "draft resume"
        resume_en.save()

        # The draft version of the person plugin should now be visible
        response = self.client.get(url)
        self.assertContains(response, "Jiji")
        self.assertContains(response, "draft resume")
        self.assertNotContains(response, "Meimei")
        self.assertNotContains(response, "public resume")
