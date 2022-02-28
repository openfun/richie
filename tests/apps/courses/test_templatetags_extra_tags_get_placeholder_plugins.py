"""Test suite for the GetPlaceholderPlugins template tag."""
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.template.exceptions import TemplateSyntaxError
from django.test import RequestFactory

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.toolbar import CMSToolbar

from richie.apps.core.factories import UserFactory
from richie.plugins.simple_text_ckeditor.cms_plugins import CKEditorPlugin


class GetPlaceholderPluginsTemplateTagsTestCase(CMSTestCase):
    """
    Integration tests to validate the behavior of the `get_placeholder_plugins` template tag.
    """

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_current_page(self):
        """
        The "get_placeholder_plugins" template tag should inject in the context, the plugins
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
            '{% get_placeholder_plugins "maincontent" as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual(output, "<b>Test 1</b>\n<b>Test 2</b>\n")

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_edit(self):
        """
        On default behavior with edit mode enabled, the "get_placeholder_plugins"
        template tag injects some HTML for the placeholder edition.
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
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" as plugins %}'
        )
        output = self.render_template_obj(template, {"plugin": plugin}, request)

        # Tag adds HTML placeholder which set stuff for DjangoCMS edition (we don't
        # assert on Javascript content since it holds too many references to write here)
        self.assertInHTML(
            ('<div class="cms-placeholder cms-placeholder-{pid:d}"></div>').format(
                pid=placeholder.id
            ),
            output,
        )

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_silent(self):
        """
        The keyword argument "silent" when set to 'True' string will disable any output
        from tag.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        plugin = add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test 1</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user
        request.session = {"cms_edit": True}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        # Default behavior without silent keyword
        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" as plugins %}'
        )
        output = self.render_template_obj(template, {"plugin": plugin}, request)
        self.assertInHTML(
            ('<div class="cms-placeholder cms-placeholder-{pid:d}"></div>').format(
                pid=placeholder.id
            ),
            output,
        )

        # If silent value is not exactly 'True' string, keep the default behavior
        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" silent=False as plugins %}'
        )
        output = self.render_template_obj(template, {"plugin": plugin}, request)
        self.assertInHTML(
            ('<div class="cms-placeholder cms-placeholder-{pid:d}"></div>').format(
                pid=placeholder.id
            ),
            output,
        )

        # When the silent keyword is set exactly to 'True' string, the tag won't output
        # anything but still adds context for 'plugins'
        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" silent=True as plugins %}'
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {"plugin": plugin}, request)

        # With available plugins context we can still render each plugin (however
        # the template elements are useless since they require placeholder output to
        # work)
        self.assertEqual(
            (
                '<template class="cms-plugin cms-plugin-start cms-plugin-{pid:d}">'
                "</template>"
                "<b>Test 1</b>\n"
                '<template class="cms-plugin cms-plugin-end cms-plugin-{pid:d}">'
                "</template>"
            ).format(pid=plugin.id),
            output,
        )

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_empty(self):
        """
        The "get_placeholder_plugins" template tag should render its node content if it has
        no plugins and the "or keyword is passed.
        """
        page_unexpected = create_page(
            "Test", "richie/single_column.html", "en", published=True
        )
        placeholder_unexpected = page_unexpected.placeholders.all()[0]
        add_plugin(placeholder_unexpected, CKEditorPlugin, "en", body="<b>Test</b>")

        page_expected = create_page(
            "current", "richie/single_column.html", "en", published=True
        )

        request = RequestFactory().get("/")
        request.current_page = page_expected
        request.user = AnonymousUser()

        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" as plugins or %}'
            "<i>empty content</i>{% endget_placeholder_plugins %}"
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual("<i>empty content</i>", output)

        # Silent keyword argument do not change anything for non edit mode and so node
        # content is still rendered
        template = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" silent=True as plugins or %}'
            "<i>empty content</i>{% endget_placeholder_plugins %}"
            "{% for plugin in plugins %}{% render_plugin plugin %}{% endfor %}"
        )
        output = self.render_template_obj(template, {}, request)
        self.assertEqual("<i>empty content</i>", output)

        # Turning to edition mode
        user = UserFactory(is_staff=True, is_superuser=True)
        request.user = user
        request.session = {"cms_edit": True}
        request.toolbar = CMSToolbar(request)
        request.toolbar.is_staff = True

        # Silent keyword argument in edition mode omit markup related to placeholder
        # edition
        output = self.render_template_obj(template, {}, request)
        self.assertEqual("<i>empty content</i>", output)

    @transaction.atomic
    def test_templatetags_get_placeholder_plugins_empty_no_or(self):
        """
        The "get_placeholder_plugins" template tag should raise an error if it has block
        content but the "or keyword was forgotten.
        """
        request = RequestFactory().get("/")
        request.current_page = create_page(
            "current", "richie/single_column.html", "en", published=True
        )
        request.user = AnonymousUser()

        template_without_or = (
            "{% load cms_tags extra_tags %}"
            '{% get_placeholder_plugins "maincontent" as plugins %}'
            "<i>empty content</i>{% endget_placeholder_plugins %}"
        )

        with self.assertRaises(TemplateSyntaxError):
            self.render_template_obj(template_without_or, {}, request)

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
