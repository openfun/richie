"""
Unit tests for the BlockPlugin template tag.
"""

from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.test import RequestFactory

from cms.api import add_plugin, create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.toolbar import CMSToolbar

from richie.apps.core.factories import UserFactory
from richie.plugins.simple_text_ckeditor.cms_plugins import CKEditorPlugin


class BlockPluginTemplateTagsTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the BlockPlugin template tag.
    """

    @transaction.atomic
    def test_templatetags_blockplugin(self):
        """
        The "blockplugin" template tag should render content to the page in which it is placed.
        """
        user = AnonymousUser()
        page = create_page("Test", "richie/single_column.html", "en", published=True)
        placeholder = page.placeholders.all()[0]
        plugin = add_plugin(placeholder, CKEditorPlugin, "en", body="<b>Test</b>")

        request = RequestFactory().get("/")
        request.current_page = page
        request.user = user
        request.session = {}
        request.toolbar = CMSToolbar(request)

        template = (
            "{% load extra_tags %}{% blockplugin plugin %}"
            "{{ instance.body|safe }}"
            "{% endblockplugin %}"
        )

        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template, {"plugin": plugin}, request
            ).replace("\n", "")
        self.assertEqual("<b>Test</b>", output)

    @transaction.atomic
    def test_templatetags_blockplugin_edit(self):
        """
        The "blockplugin" template tag should include edit markup when edit mode is on.
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
            "{% load extra_tags %}{% blockplugin plugin %}"
            "{{ instance.body|safe }}"
            "{% endblockplugin %}"
        )

        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template, {"plugin": plugin}, request
            ).replace("\n", "")
        self.assertEqual(
            (
                '<template class="cms-plugin cms-plugin-start cms-plugin-{pid:d}"></template>'
                "<b>Test</b>"
                '<template class="cms-plugin cms-plugin-end cms-plugin-{pid:d}"></template>'
            ).format(pid=plugin.id),
            output,
        )
