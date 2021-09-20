# -*- coding: utf-8 -*-
"""
Unit tests for the Course plugin and its model
"""
import re
from datetime import datetime
from unittest import mock

from django import forms
from django.conf import settings
from django.test import TestCase
from django.utils import timezone

from cms.api import add_plugin, create_page

from richie.apps.core.factories import UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CoursePlugin
from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    OrganizationFactory,
)
from richie.apps.courses.models import CoursePluginModel


class CoursePluginTestCase(TestCase):
    """
    Test that CoursePlugin correctly displays a Course's page placeholders content
    """

    def test_cms_plugins_course_form_page_choices(self):
        """
        The form to create a course plugin should only list course pages
        in the select box and no snapshot. There shouldn't be any duplicate because
        of published status.
        """

        class CoursePluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = CoursePluginModel
                fields = ["page"]

        page = create_i18n_page("A page")
        page.publish("en")
        course = CourseFactory(page_parent=page, should_publish=True)
        other_page_title = "other page"
        create_page(
            other_page_title, "richie/single_column.html", settings.LANGUAGE_CODE
        )
        plugin_form = CoursePluginModelForm()
        rendered_form = plugin_form.as_table()
        self.assertEqual(rendered_form.count(course.extended_object.get_title()), 1)
        self.assertNotIn(other_page_title, plugin_form.as_table())

        # Create a fake course snapshot and make sure it's not available to select
        snapshot = CourseFactory(
            page_parent=course.extended_object, should_publish=True
        )
        self.assertNotIn(snapshot.extended_object.get_title(), plugin_form.as_table())

    def test_cms_plugins_course_render_on_public_page(self):
        """
        Test that a CoursePlugin correctly renders course's page specific information
        """
        icon_category_main = CategoryFactory(
            page_title={"en": "icon title", "fr": "titre icone"},
            fill_icon=True,
            should_publish=True,
        )
        icon_category_secondary = CategoryFactory(fill_icon=True, should_publish=True)

        # Create a course with a page in both english and french
        organization = OrganizationFactory(
            page_title="public title", should_publish=True
        )

        course = CourseFactory(
            page_title={"en": "public title", "fr": "titre public"},
            fill_organizations=[organization],
            fill_icons=[icon_category_main, icon_category_secondary],
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
            should_publish=True,
        )
        course_page = course.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CoursePlugin, "en", **{"page": course_page})
        add_plugin(placeholder, CoursePlugin, "fr", **{"page": course_page})

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)
        self.assertContains(response, "public title")
        self.assertNotContains(response, "titre public")

        # The course's url should be present
        self.assertIn(
            '<a class="course-glimpse" href="/en/public-title/"',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # The course's name should be present
        self.assertContains(
            response,
            f'<p class="course-glimpse__title">{course_page.get_title():s}</p>',
            status_code=200,
        )
        # The course's main organization should be present
        self.assertIsNotNone(
            re.search(
                (
                    r'<div class="course-glimpse__organization">'
                    r'<svg role="img".*'
                    r'<use href="#icon-org" />'
                ),
                str(response.content),
            )
        )
        self.assertContains(
            response, organization.extended_object.get_title(), status_code=200
        )

        # The course's cover should be present
        pattern = (
            r'<div class="course-glimpse__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # The course's icon should be present
        pattern = (
            r'<div class="course-glimpse__icon">'
            r'.*<img src="/media/filer_public_thumbnails/filer_public/.*icon\.jpg__40x40'
            r'.*alt="icon title"'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # The draft course plugin should not be present
        # Check if draft is shown after unpublish
        course_page.unpublish("en")
        page.publish("en")
        response = self.client.get(url)
        self.assertNotContains(response, "public title")
        self.assertNotContains(response, course_page.get_absolute_url())

        # Check the page content in french
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(response, "titre public")

        # The course's url should be present
        self.assertIn(
            '<a class="course-glimpse" href="/fr/titre-public/"',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # The course's name should be present
        self.assertContains(
            response,
            f'<p class="course-glimpse__title">{course_page.get_title():s}</p>',
            status_code=200,
        )

        # The course's main organization should be present
        self.assertIsNotNone(
            re.search(
                (
                    r'<div class="course-glimpse__organization">'
                    r'<svg role="img".*'
                    r'<use href="#icon-org" />'
                ),
                str(response.content),
            )
        )
        self.assertContains(
            response, organization.extended_object.get_title(), status_code=200
        )

        # The course's cover should be present
        pattern = (
            r'<div class="course-glimpse__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # The course's icon should be present
        pattern = (
            r'<div class="course-glimpse__icon">'
            r'.*<img src="/media/filer_public_thumbnails/filer_public/.*icon\.jpg__40x40'
            r'.*alt="titre icone"'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

        # The draft course plugin should not be present
        # Check if draft is shown after unpublish
        course_page.unpublish("fr")
        page.publish("fr")
        response = self.client.get(url)
        self.assertNotContains(response, "titre public")
        self.assertNotContains(response, course_page.get_absolute_url())

    def test_cms_plugins_course_render_on_draft_page(self):
        """
        The course plugin should render as expected on a draft page.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Course
        course = CourseFactory(page_title="public title")
        course_page = course.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CoursePlugin, "en", **{"page": course_page})

        course_page.publish("en")
        course_page.unpublish("en")

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The unpublished course plugin should not be visible on the draft page
        response = self.client.get(url)
        self.assertNotContains(response, "public title")

        # Now publish the category and modify it to have a draft different from the
        # public version
        course_page.publish("en")
        title_obj = course_page.get_title_obj(language="en")
        title_obj.title = "draft title"
        title_obj.save()

        # The draft version of the course plugin should not be visible
        response = self.client.get(url)
        self.assertNotContains(response, "draft title")
        self.assertContains(response, "public title")

    def test_cms_plugins_course_render_variant(self):
        """
        The course plugin should render according to the variant option.
        """
        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")

        # Create a Course
        course = CourseFactory(page_title="public title", should_publish=True)
        course_page = course.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        # Add course plugin with default variant
        add_plugin(placeholder, CoursePlugin, "en", page=course_page)

        page_url = page.get_absolute_url(language="en")
        url = f"{page_url:s}?edit"

        # The course-glimpse default variant should not have the large attribute
        response = self.client.get(url)
        self.assertNotContains(response, "glimpse__large")

        # Add course plugin with large variant
        add_plugin(
            placeholder, CoursePlugin, "en", page=course_page, variant="glimpse__large"
        )

        # The new course-glimpse should have the large attribute
        response = self.client.get(url)
        self.assertContains(response, "course-glimpse__large")

    def test_cms_plugins_course_fallback_when_never_published(self):
        """
        The course plugin should render in the fallback language when the course
        page has never been published in the current language.
        """
        course = CourseFactory(
            page_title={"en": "public course", "fr": "cours public"},
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
        )
        course_page = course.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CoursePlugin, "en", **{"page": course_page})
        add_plugin(placeholder, CoursePlugin, "fr", **{"page": course_page})

        # Publish only the French version of the course
        course_page.publish("fr")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        # The course path in french should be in the url but the locale in the
        # url should remain "en"
        self.assertIn(
            '<a class="course-glimpse" href="/en/cours-public/"',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        # The course's name should be present
        self.assertIn(
            '<p class="course-glimpse__title">cours public</p>',
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )
        self.assertNotContains(response, "public course")

        # The course's cover should be present
        pattern = (
            r'<div class="course-glimpse__media">'
            r'<img src="/media/filer_public_thumbnails/filer_public/.*cover\.jpg__300x170'
            r'.*alt=""'
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_cms_plugins_course_fallback_when_published_unpublished(self):
        """
        The course plugin should not render when the course was voluntarily
        unpublished in the current language.
        """
        # Create a course
        course = CourseFactory(
            page_title={"en": "public title", "fr": "titre public"},
            should_publish=True,
        )
        course_page = course.extended_object

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CoursePlugin, "en", **{"page": course_page})
        add_plugin(placeholder, CoursePlugin, "fr", **{"page": course_page})

        # Publish only the French version of the course
        with mock.patch(
            "cms.models.pagemodel.now",
            return_value=datetime(2019, 11, 30, tzinfo=timezone.utc),
        ):
            course_page.publish("fr")

        course_page.publish("en")
        course_page.unpublish("en")

        # Check the page content in English
        page.publish("en")
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)

        self.assertNotContains(response, "glimpse")
