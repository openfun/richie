"""Test suite for the GetPagePlugins template tag."""

from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.template.exceptions import TemplateSyntaxError
from django.test import RequestFactory

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.toolbar import CMSToolbar

from richie.apps.core.factories import UserFactory
from richie.plugins.simple_text_ckeditor.cms_plugins import CKEditorPlugin


class PlaceholderAsPluginsTemplateTagsTestCase(CMSTestCase):
    """
    Integration tests to validate the behavior of the `placeholder_as_plugins` template tag.
    """

    @transaction.atomic
    def test_templatetags_placeholder_as_plugins_current_page(self):
        """
        The "placeholder_as_plugins" template tag should inject in the context, the plugins
        of the targeted placeholder on the current page.
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
            '{% placeholder_as_plugins "maincontent" as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual(output, "<b>Test 1</b>\n<b>Test 2</b>\n")

    @transaction.atomic
    def test_templatetags_placeholder_as_plugins_empty(self):
        """
        The "placeholder_as_plugins" template tag should render its node content if it has
        no plugins and the "or keyword is passed.
        """
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
            '{% placeholder_as_plugins "maincontent" as plugins or %}'
            "<i>empty content</i>{% endplaceholder_as_plugins %}"
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual("<i>empty content</i>", output)

    @transaction.atomic
    def test_templatetags_placeholder_as_plugins_empty_no_or(self):
        """
        The "placeholder_as_plugins" template tag should raise an error if it has block
        content but the "or keyword was forgotten.
        """
        request = RequestFactory().get("/")
        request.current_page = create_page(
            "current", "richie/single_column.html", "en", published=True
        )
        request.user = AnonymousUser()

        template_without_or = (
            "{% load cms_tags extra_tags %}"
            '{% placeholder_as_plugins "maincontent" as plugins %}'
            "<i>empty content</i>{% endplaceholder_as_plugins %}"
        )

        with self.assertRaises(TemplateSyntaxError):
            self.render_template_obj(template_without_or, {}, request)

    @transaction.atomic
    def test_templatetags_placeholder_as_plugins_unknown_placeholder(self):
        """
        When a new placeholder is added to the code, it does not exist on pages that were
        pre-existing. The `placeholder_as_plugins` should not fail in this case.
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = AnonymousUser()

        template = (
            "{% load cms_tags extra_tags %}"
            '{% placeholder_as_plugins "unknown" as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual(output, "")

    @transaction.atomic
    def test_templatetags_placeholder_as_plugins_edit(self):
        """
        The "placeholder_as_plugins" template tag should inject in the page the edit markup
        """
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test 1</b>")
        add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test 2</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        user = UserFactory(is_staff=True, is_superuser=True)
        request.user = user
        request.session = {"cms_edit": True}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        # Silent keyword argument in edition mode omit markup related to placeholder
        # edition
        template = (
            "{% load cms_tags extra_tags %}"
            '{% placeholder_as_plugins "maincontent" as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)

        # Tag adds HTML placeholder which set stuff for DjangoCMS edition (we don't
        # assert on Javascript content since it holds too many references to write here)
        self.assertInHTML(
            f'<div class="cms-placeholder cms-placeholder-{placeholder.id:d}"></div>',
            output,
        )
        self.assertIn(
            "CMS._plugins.push",
            output,
        )
