"""Testing DjangoCMS plugin declaration for Richie's plain text plugin."""

import random

from django.test import TestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings

from cms.api import add_plugin
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer

from richie.plugins.plain_text.cms_plugins import PlainTextPlugin
from richie.plugins.plain_text.factories import PlainTextFactory


class PlainTextPluginTestCase(TestCase):
    """Test suite for the plain text plugin."""

    def test_cms_plugins_plaintext_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        """
        placeholder = Placeholder.objects.create(slot="test")

        # Create random values for parameters with a factory
        plain_text = PlainTextFactory()

        model_instance = add_plugin(
            placeholder, PlainTextPlugin, "en", body=plain_text.body
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, None)

        # Check if "instance" is in context
        self.assertIn("instance", context)

        # Check if parameters, generated by the factory, are correctly set in "instance" of context
        self.assertEqual(context["instance"].body, plain_text.body)

        # Get generated html for plain text body
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check rendered body is correct after save and sanitize
        self.assertInHTML(plain_text.body, html)

    def test_cms_plugins_plaintext_get_form_add(self):
        """
        It should be possible to configure the max_length configuration when adding
        a plain text plugin to a specific placeholder.
        """
        placeholder = Placeholder.objects.create(slot="first")
        request = RequestFactory().get(f"/?placeholder_id={placeholder.id:d}")
        plugin = PlainTextPlugin()

        max_length = random.randint(1, 5)

        with override_settings(RICHIE_PLAINTEXT_MAXLENGTH={"first": max_length}):
            form_class = plugin.get_form(request)

        form = form_class()
        body_field = form.fields["body"]
        self.assertEqual(len(body_field.validators), 2)
        self.assertEqual(body_field.validators[1].limit_value, max_length)

    def test_cms_plugins_plaintext_get_form_update(self):
        """
        It should be possible to configure the max_length configuration when updating
        a plain text plugin on a specific placeholder.
        """
        placeholder = Placeholder.objects.create(slot="first")
        request = RequestFactory().get("/")
        plugin = PlainTextPlugin()
        plain_text = PlainTextFactory(placeholder=placeholder)

        max_length = random.randint(1, 5)

        with override_settings(RICHIE_PLAINTEXT_MAXLENGTH={"first": max_length}):
            form_class = plugin.get_form(request, obj=plain_text)

        form = form_class()
        body_field = form.fields["body"]
        self.assertEqual(len(body_field.validators), 2)
        self.assertEqual(body_field.validators[1].limit_value, max_length)

    def test_cms_plugins_plaintext_get_form_no_setting(self):
        """Getting the form should not fail if there is no configuration setting."""
        placeholder = Placeholder.objects.create(slot="slot")
        request = RequestFactory().get(f"/?placeholder_id={placeholder.id:d}")
        plugin = PlainTextPlugin()

        with override_settings(RICHIE_PLAINTEXT_MAXLENGTH={}):
            form_class = plugin.get_form(request)

        form = form_class()
        self.assertEqual(len(form.fields["body"].validators), 1)
