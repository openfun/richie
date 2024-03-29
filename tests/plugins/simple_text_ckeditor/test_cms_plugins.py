"""
Plugin tests
"""

import random
from unittest import mock

from django.test import TestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings

from cms.api import add_plugin
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer

from richie.plugins.simple_text_ckeditor.cms_plugins import CKEditorPlugin
from richie.plugins.simple_text_ckeditor.factories import SimpleTextFactory


class CKEditorCMSPluginsTestCase(TestCase):
    """Plugin tests case"""

    def test_cms_plugins_simpletext_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        """
        placeholder = Placeholder.objects.create(slot="test")

        # Create random values for parameters with a factory
        simpletext = SimpleTextFactory()

        model_instance = add_plugin(
            placeholder, CKEditorPlugin, "en", body=simpletext.body
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, None)

        # Check if "instance" is in context
        self.assertIn("instance", context)

        # Check if parameters, generated by the factory, are correctly set in "instance" of context
        self.assertEqual(context["instance"].body, simpletext.body)

        # Get generated html for simpletext body
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check rendered body is correct after save and sanitize
        self.assertInHTML(simpletext.body, html)

    def test_cms_plugins_simpletext_get_form_add(self):
        """
        It should be possible to configure the max_length and ckeditor configuration when
        adding a plugin to a specific placeholder.
        It should take the first configuration that matches our placeholder.
        """
        placeholder = Placeholder.objects.create(
            slot=random.choice(["first", "second"])
        )
        request = RequestFactory().get(f"/?placeholder_id={placeholder.id:d}")
        plugin = CKEditorPlugin()

        allowed_content = random.sample(["b", "i", "p", "span"], 2)
        max_length = random.randint(1, 5)

        with mock.patch(
            "richie.plugins.simple_text_ckeditor.cms_plugins.SIMPLETEXT_CONFIGURATION",
            [
                {
                    "placeholders": ["first", "second"],
                    "ckeditor": "TEST_CONFIGURATION",
                    "max_length": max_length,
                },
                {
                    "placeholders": ["first"],
                    "ckeditor": "WRONG_CONFIGURATION",
                    "max_length": 10,
                },
                {
                    "placeholders": ["second"],
                    "ckeditor": "WRONG_CONFIGURATION",
                    "max_length": 20,
                },
            ],
        ):
            with override_settings(
                TEST_CONFIGURATION={"allowedContent": allowed_content}
            ):
                form_class = plugin.get_form(request)

        form = form_class()
        body_field = form.fields["body"]
        self.assertEqual(len(body_field.validators), 2)
        self.assertEqual(body_field.validators[1].limit_value, max_length)
        self.assertEqual(
            body_field.widget.configuration["allowedContent"], allowed_content
        )

    def test_cms_plugins_simpletext_get_form_update(self):
        """
        It should be possible to configure the max_length and ckeditor configuration when
        updating an existing plugin on a specific placeholder.
        It should take the first configuration that matches our placeholder.
        """
        placeholder = Placeholder.objects.create(
            slot=random.choice(["first", "second"])
        )
        request = RequestFactory().get("/")
        plugin = CKEditorPlugin()
        simple_text = SimpleTextFactory(placeholder=placeholder)

        allowed_content = random.sample(["b", "i", "p", "span"], 2)
        max_length = random.randint(1, 5)

        with mock.patch(
            "richie.plugins.simple_text_ckeditor.cms_plugins.SIMPLETEXT_CONFIGURATION",
            [
                {
                    "placeholders": ["first", "second"],
                    "ckeditor": "TEST_CONFIGURATION",
                    "max_length": max_length,
                },
                {
                    "placeholders": ["first"],
                    "ckeditor": "WRONG_CONFIGURATION",
                    "max_length": 10,
                },
                {
                    "placeholders": ["second"],
                    "ckeditor": "WRONG_CONFIGURATION",
                    "max_length": 20,
                },
            ],
        ):
            with override_settings(
                TEST_CONFIGURATION={"allowedContent": allowed_content}
            ):
                form_class = plugin.get_form(request, obj=simple_text)

        form = form_class()
        body_field = form.fields["body"]
        self.assertEqual(len(body_field.validators), 2)
        self.assertEqual(body_field.validators[1].limit_value, max_length)
        self.assertEqual(
            body_field.widget.configuration["allowedContent"], allowed_content
        )

    def test_cms_plugins_simpletext_get_form_no_setting(self):
        """Getting the form should not fail if there is no configuration setting."""
        placeholder = Placeholder.objects.create(slot="slot")
        request = RequestFactory().get(f"/?placeholder_id={placeholder.id:d}")
        plugin = CKEditorPlugin()

        with mock.patch(
            "richie.plugins.simple_text_ckeditor.cms_plugins.SIMPLETEXT_CONFIGURATION",
            [],
        ):
            form_class = plugin.get_form(request)

        form = form_class()
        self.assertEqual(len(form.fields["body"].validators), 1)

    def test_cms_plugins_simpletext_get_form_other_placeholder(self):
        """
        If the current placeholder is not targeted by the setting, the default configuration
        should apply.
        """
        placeholder = Placeholder.objects.create(slot="slot")
        request = RequestFactory().get(f"/?placeholder_id={placeholder.id:d}")
        plugin = CKEditorPlugin()

        allowed_content = random.sample(["b", "i", "p", "span"], 2)
        max_length = random.randint(1, 5)

        with mock.patch(
            "richie.plugins.simple_text_ckeditor.cms_plugins.SIMPLETEXT_CONFIGURATION",
            [
                {
                    "placeholders": ["other"],
                    "ckeditor": "TEST_CONFIGURATION",
                    "max_length": max_length,
                }
            ],
        ):
            with override_settings(
                TEST_CONFIGURATION={"allowedContent": allowed_content}
            ):
                form_class = plugin.get_form(request)

        form = form_class()
        body_field = form.fields["body"]
        # The max length validator should not have been added
        self.assertEqual(len(body_field.validators), 1)
        # The CKEditor configuration should be the default one
        self.assertEqual(body_field.widget.configuration["allowedContent"], True)
