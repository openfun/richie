# -*- coding: utf-8 -*-
"""
Unit tests for the subject plugin and its model
"""
from django import forms
from django.conf import settings

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from djangocms_picture.cms_plugins import PicturePlugin

from richie.apps.core.factories import FilerImageFactory, UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import SubjectPlugin
from richie.apps.courses.factories import SubjectFactory
from richie.apps.courses.models import SubjectPluginModel


class SubjectPluginTestCase(CMSTestCase):
    """
    Test that SubjectPlugin correctly displays a Subject's page placeholders content
    """

    def test_cms_plugins_subject_form_page_choices(self):
        """
        The form to create a subject plugin should only list subject pages in the select box.
        """

        class SubjectPluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = SubjectPluginModel
                fields = ["page"]

        subject = SubjectFactory()
        other_page_title = "other page"
        create_page(other_page_title, "richie/fullwidth.html", settings.LANGUAGE_CODE)
        plugin_form = SubjectPluginModelForm()
        self.assertIn(subject.extended_object.get_title(), plugin_form.as_table())
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_subject_render_on_public_page(self):
        """
        The subject plugin should render as expected on a public page.
        """
        # Create a filer fake image
        image = FilerImageFactory()

        # Create a Subject
        subject = SubjectFactory(
            page_title={"en": "public title", "fr": "titre publique"}
        )
        subject_page = subject.extended_object

        # Add logo to related placeholder
        logo_placeholder = subject_page.placeholders.get(slot="logo")
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
        add_plugin(placeholder, SubjectPlugin, "en", **{"page": subject_page})
        add_plugin(placeholder, SubjectPlugin, "fr", **{"page": subject_page})

        subject_page.publish("en")
        subject_page.publish("fr")
        subject.refresh_from_db()

        page.publish("en")
        page.publish("fr")

        url = page.get_absolute_url(language="en")

        # The subject plugin should not be visible on the public page before it is published
        subject_page.unpublish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # Republish the plugin
        subject_page.publish("en")

        # Now modify the subject to have a draft different from the public version
        title_obj = subject_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # Publishing the page again should make the plugin public
        page.publish("en")

        # Check the page content in English
        response = self.client.get(url)
        # Subject's title should be present as a link to the cms page
        # And CMS page title should be in title attribute of the link
        self.assertContains(
            response,
            '<a class="subject-plugin__body" href="/en/public-title/" title="{title:s}"'.format(
                title=subject.public_extension.extended_object.get_title()
            ),
            status_code=200,
        )
        # The subject's title should be wrapped in a div
        self.assertContains(
            response,
            '<div class="subject-plugin__title">{:s}</div>'.format(
                subject.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        self.assertNotContains(response, "draft title")

        # Subject's logo should be present
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)

        # Same checks in French
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(
            response,
            '<a class="subject-plugin__body" href="/fr/titre-publique/" title="{title:s}"'.format(
                title=subject.public_extension.extended_object.get_title()
            ),
            status_code=200,
        )
        # pylint: disable=no-member
        self.assertContains(response, image.file.name)

    def test_cms_plugins_subject_render_on_draft_page(self):
        """
        The subject plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Subject
        subject = SubjectFactory(page_title="public title")
        subject_page = subject.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, SubjectPlugin, "en", **{"page": subject_page})

        subject_page.publish("en")
        subject_page.unpublish("en")

        url = "{:s}?edit".format(page.get_absolute_url(language="en"))

        # The subject plugin should still be visible on the draft page
        response = self.client.get(url)
        self.assertContains(response, "public title")

        # Now modify the subject to have a draft different from the public version
        title_obj = subject_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the subject plugin should now be visible
        response = self.client.get(url)
        self.assertContains(response, "draft title")
        self.assertNotContains(response, "public title")
