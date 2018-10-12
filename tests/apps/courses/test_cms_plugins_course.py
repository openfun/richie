# -*- coding: utf-8 -*-
"""
Unit tests for the Course plugin and its model
"""
from django import forms
from django.conf import settings
from django.test import TestCase

from cms.api import add_plugin, create_page

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CoursePlugin
from richie.apps.courses.factories import (
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    SubjectFactory,
)
from richie.apps.courses.models import CoursePluginModel


class CoursePluginTestCase(TestCase):
    """
    Test that CoursePlugin correctly displays a Course's page placeholders content
    """

    def test_cms_plugins_course_form_page_choices(self):
        """
        The form to create a course plugin should only list course pages
        in the select box.
        """

        class CoursePluginModelForm(forms.ModelForm):
            """A form for testing the choices in the select box"""

            class Meta:
                model = CoursePluginModel
                exclude = ()

        course = CourseFactory()
        other_page_title = "other page"
        create_page(other_page_title, "richie/fullwidth.html", settings.LANGUAGE_CODE)
        plugin_form = CoursePluginModelForm()
        self.assertIn(course.extended_object.get_title(), plugin_form.as_table())
        self.assertNotIn(other_page_title, plugin_form.as_table())

    def test_cms_plugins_course_render(self):
        """
        Test that an CoursePlugin correctly renders course's page specific information
        """
        # Create an Course with a page in both english and french
        subjects = SubjectFactory.create_batch(4)
        organizations = OrganizationFactory.create_batch(4)

        course = CourseFactory(
            organization_main=organizations[0],
            title="Very interesting course",
            languages=["en", "fr"],
            with_organizations=organizations,
            with_subjects=subjects,
            fill_cover=True,
            should_publish=True,
        )
        course_page = course.extended_object
        CourseRunFactory.create_batch(2, course=course)

        # Create a page to add the plugin to
        page = create_i18n_page({"en": "A page", "fr": "Une page"})
        placeholder = page.placeholders.get(slot="maincontent")
        add_plugin(placeholder, CoursePlugin, "en", **{"course": course})
        add_plugin(placeholder, CoursePlugin, "fr", **{"course": course})

        page.publish("en")
        page.publish("fr")

        # Check the page content in English
        url = page.get_absolute_url(language="en")
        response = self.client.get(url)
        self.assertContains(response, "Very interesting course en", html=True)
        self.assertNotIn("Very interesting course fr", response)

        # The course's url should be present
        self.assertContains(
            response,
            '<a class="course-glimpse course-glimpse--link" href="{url}">'.format(
                url=course_page.get_absolute_url()
            ),
            status_code=200,
        )

        # The course's name should be present
        self.assertContains(
            response,
            '<p class="course-glimpse__content__title">{title}</p>'.format(
                title=course_page.get_title()
            ),
            status_code=200,
        )
        # The course's main organization should be present
        self.assertContains(
            response,
            "<p>{title}</p>".format(
                title=course.organization_main.extended_object.get_title()
            ),
            status_code=200,
        )

        # The draft course plugin should not be present
        # Check if draft is shown after unpublish
        course.extended_object.unpublish("en")
        self.assertNotIn("Very interesting course", response)
        self.assertNotIn(
            '<p class="course-glimpse__content__title">{title}</p>'.format(
                title=course_page.get_title()
            ),
            response,
        )
        self.assertNotIn(course_page.get_absolute_url(), response)

        # Check the page content in french
        url = page.get_absolute_url(language="fr")
        response = self.client.get(url)
        self.assertContains(response, "Very interesting course fr", html=True)
        self.assertNotIn("Very interesting course en", response)

        # The course's url should be present
        self.assertContains(
            response,
            '<a class="course-glimpse course-glimpse--link" href="{url}">'.format(
                url=course_page.get_absolute_url()
            ),
            status_code=200,
        )

        # The course's name should be present
        self.assertContains(
            response,
            '<p class="course-glimpse__content__title">{title}</p>'.format(
                title=course_page.get_title()
            ),
            status_code=200,
        )

        # The course's main organization should be present
        self.assertContains(
            response,
            "<p>{title}</p>".format(
                title=course.organization_main.extended_object.get_title()
            ),
            status_code=200,
        )

        # The draft course plugin should not be present
        # Check if draft is shown after unpublish
        course.extended_object.unpublish("fr")
        self.assertNotIn("Very interesting course", response)
        self.assertNotIn(
            '<p class="course-glimpse__content__title">{title}</p>'.format(
                title=course_page.get_title()
            ),
            response,
        )
        self.assertNotIn(course_page.get_absolute_url(), response)
