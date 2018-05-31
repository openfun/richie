# -*- coding: utf-8 -*-
"""
Unit tests for the Person plugin and its model
"""
from django.test import TestCase

from cms.api import add_plugin
from cmsplugin_plain_text.cms_plugins import PlaintextPlugin
from djangocms_picture.cms_plugins import PicturePlugin

from richie.apps.core.factories import FilerImageFactory, UserFactory
from richie.apps.core.helpers import create_i18n_page

from ..cms_plugins import PersonPlugin
from ..factories import PersonFactory


class PersonPluginTestCase(TestCase):
    """
    Test that PersonPlugin correctly displays a Person's page placeholders content
    """

    def test_person_plugin_render(self):
        """
        Test that a PersonPlugin correctly renders person's page specific information
        """
        # Create a filer fake image
        staff = UserFactory(is_staff=True, is_superuser=True)
        image = FilerImageFactory(owner=staff)

        # Create a Person
        person = PersonFactory()
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
        # A resume to related placeholder
        resume_placeholder = person_page.placeholders.get(slot="resume")
        add_plugin(
            resume_placeholder, PlaintextPlugin, "en", **{"body": "A short resume"}
        )
        add_plugin(
            resume_placeholder, PlaintextPlugin, "fr", **{"body": "un résumé court"}
        )

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, PersonPlugin, "en", **{"page": person_page})
        add_plugin(placeholder, PersonPlugin, "fr", **{"page": person_page})

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)
        # Person's name should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertContains(
            response,
            '<a href="{url}" title="{page_title}">'.format(
                url=person_page.get_absolute_url(), page_title=person_page.get_title()
            ),
            status_code=200,
        )
        self.assertContains(response, person.get_full_name(), html=True)
        # Person's portrait and its properties should be present
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)
        # Short resume should be present
        self.assertContains(response, "A short resume")

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a href="{url}" title="{page_title}">'.format(
                url=person_page.get_absolute_url(), page_title=person_page.get_title()
            ),
            status_code=200,
        )
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)
        self.assertContains(response, "un résumé court", html=True)
