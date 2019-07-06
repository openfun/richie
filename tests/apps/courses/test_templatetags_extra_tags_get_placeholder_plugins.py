"""Test suite for the GetPlaceholderPlugins template tag."""
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.template.exceptions import TemplateSyntaxError
from django.test import RequestFactory

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase

from richie.plugins.simple_text_ckeditor.cms_plugins import CKEditorPlugin


class GetPlaceholderPluginsTemplateTagsTestCase(CMSTestCase):
    """
    Integration tests to validate the behavior of the `get_placeholder_plugins` template tag.
    """

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_current_page(self):
        """
        The "get_placeholder_plugins" template tag should inject in the context, the plugins
        of the targeted placeholder on the current page by default.
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test 1</b>")
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test 2</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()

        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual(output, "<b>Test 1</b>\n<b>Test 2</b>\n")

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_other_page(self):
        """
        The "get_placeholder_plugins" template tag should inject in the context, the plugins
        of the targeted placeholder on the page targeted by a page lookup when it is provided.
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test 1</b>")
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test 2</b>")

        request = RequestFactory().get("/")
        request.current_page = create_page(
            "current", "richie/single_column.html", "en", published=True
        )
        request.user = AnonymousUser()

        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" page as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual(output, "<b>Test 1</b>\n<b>Test 2</b>\n")

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_empty(self):
        """
        The "get_placeholder_plugins" template tag should render its node content if it has
        no plugins and the "or keyword is passed.
        """
        empty_page = create_page(
            "Test", "richie/single_column.html", "en", published=True
        )
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test</b>")

        request = RequestFactory().get("/")
        request.current_page = create_page(
            "current", "richie/single_column.html", "en", published=True
        )
        request.user = AnonymousUser()

        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" page as plugins or %}'
            "<i>empty content</i>{% endget_placeholder_plugins %}"
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {"page": page}, request)
        self.assertEqual("<b>Test</b>\n", output)

        output = self.render_template_obj(template, {"page": empty_page}, request)
        self.assertEqual("<i>empty content</i>", output)

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_empty_no_or(self):
        """
        The "get_placeholder_plugins" template tag should raise an error if it has empty content
        but the "or keyword was forgotten.
        """
        empty_page = create_page(
            "Test", "richie/single_column.html", "en", published=True
        )

        request = RequestFactory().get("/")
        request.current_page = create_page(
            "current", "richie/single_column.html", "en", published=True
        )
        request.user = AnonymousUser()

        template_without_or = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" page as plugins %}'
            "<i>empty content</i>{% endget_placeholder_plugins %}"
        )

        with self.assertRaises(TemplateSyntaxError):
            self.render_template_obj(template_without_or, {"page": empty_page}, request)

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_unknown_placeholder(self):
        """
        When a new placeholder is added to the code, it does not exist on pages that were
        pre-existing. The `get_placeholder_plugins` should not fail in this case.
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()

        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "unknown" as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual(output, "")
