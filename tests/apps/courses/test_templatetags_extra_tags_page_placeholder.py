"""
Unit tests for the PagePlaceholder template tag.
"""
from django.db import transaction
from django.test import RequestFactory

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.toolbar import CMSToolbar

from richie.apps.core.factories import UserFactory
from richie.plugins.simple_text_ckeditor.cms_plugins import CKEditorPlugin


class PagePlaceholderTemplateTagsTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the PagePlaceholder template tag.
    """

    @transaction.atomic
    def test_templatetags_page_placeholder_current_page_edit(self):
        """
        The "page_placeholder" template tag should work as the "placeholder" template tag when
        the "page" passed as argument is the current page and edit mode is on.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        plugin = add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user
        request.session = {"cms_edit": True}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        template = (
            '{% load cms_tags extra_tags %}{% page_placeholder "maincontent" page %}'
        )
        with self.assertNumQueries(3):
            output = self.render_template_obj(template, {"page": page}, request)
        self.assertIn(
            (
                '<template class="cms-plugin cms-plugin-start cms-plugin-{pid:d}"></template>'
                "<b>Test</b>\n"
                '<template class="cms-plugin cms-plugin-end cms-plugin-{pid:d}"></template>'
            ).format(pid=plugin.id),
            output,
        )

    @transaction.atomic
    def test_templatetags_page_placeholder_current_page(self):
        """
        The "page_placeholder" template tag should work as the "placeholder" template tag when
        the "page" passed as argument is the current page and edit mode is off.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user
        request.session = {}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        template = (
            '{% load cms_tags extra_tags %}{% page_placeholder "maincontent" page %}'
        )
        # If edit mode is off, he frontend editing markup should not be included in the page
        with self.assertNumQueries(3):
            output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual("<b>Test</b>\n", output)

    @transaction.atomic
    def test_templatetags_page_placeholder_other_page(self):
        """
        The "page_placeholder" template tag should work as the "show_placeholder" template tag
        when the "page" passed as argument is different from the current page (readonly display).
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        current_page = create_page(
            "Current", "richie/single_column.html", "en", published=True
        )

        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test</b>")

        request = RequestFactory().get("/")
        request.current_page = current_page
        request.user = user
        request.session = {"cms_edit": True}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        template = (
            '{% load cms_tags extra_tags %}{% page_placeholder "maincontent" page %}'
        )
        with self.assertNumQueries(3):
            output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual("<b>Test</b>\n", output)

    @transaction.atomic
    def test_templatetags_page_placeholder_as_variable(self):
        """
        The output of the "page_placeholder" template tag can be retrieved as a variable instead
        of being returned directly in the template.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user
        request.session = {}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        template = (
            '{% load cms_tags extra_tags %}{% page_placeholder "maincontent" page as var %}'
            "<h1>{{ var }}</h1>"
        )
        with self.assertNumQueries(3):
            output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual("<h1><b>Test</b>\n</h1>", output)

    @transaction.atomic
    def test_templatetags_page_placeholder_or(self):
        """
        The "page_placeholder" template tag should have the same "or" option as the "placeholder"
        template tag.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        empty_page = create_page(
            "Test", "richie/single_column.html", "en", published=True
        )
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user
        request.session = {}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        template = (
            '{% load cms_tags extra_tags %}{% page_placeholder "maincontent" page as var or %}'
            "<i>empty content</i>{% endpage_placeholder %}<h1>{{ var }}</h1>"
        )
        with self.assertNumQueries(3):
            output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual("<h1><b>Test</b>\n</h1>", output)

        with self.assertNumQueries(3):
            output = self.render_template_obj(template, {"page": empty_page}, request)
        self.assertEqual("<h1><i>empty content</i></h1>", output)
