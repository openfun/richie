"""Testing DjangoCMS plugin declaration for Richie's LTI consumer plugin."""
import json
import random
from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase, override_settings
from django.test.client import RequestFactory

from cms.api import add_plugin
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer
from cms.toolbar.toolbar import CMSToolbar

from richie.plugins.lti_consumer.cms_plugins import LTIConsumerPlugin
from richie.plugins.lti_consumer.models import LTIConsumer


class LTIConsumerPluginTestCase(TestCase):
    """Test suite for the LTI consumer plugin."""

    @mock.patch.object(
        LTIConsumer, "get_content_parameters", return_value="test_content"
    )
    def test_cms_plugins_lti_consumer_context_and_html(self, mock_params):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        """
        placeholder = Placeholder.objects.create(slot="test")

        url = "http://localhost:8060/lti/videos/"
        resizing = random.choice([True, False])
        edit = random.choice([True, False])
        lti_providers = {
            "lti_provider_test": {
                "base_url": "http://localhost:8060/lti/videos/",
                "is_base_url_regex": False,
                "automatic_resizing": resizing,
                "inline_ratio": 0.3312,
                "oauth_consumer_key": "TestOauthConsumerKey",
                "shared_secret": "TestSharedSecret",
            }
        }

        request = RequestFactory()
        request.user = AnonymousUser()
        request.session = {}
        request.path = "/"
        request.toolbar = CMSToolbar(request)
        request.toolbar.edit_mode_active = edit
        global_context = {"request": request}

        model_instance = add_plugin(
            placeholder,
            LTIConsumerPlugin,
            "en",
            url=url,
            lti_provider_id="lti_provider_test",
        )
        plugin_instance = model_instance.get_plugin_class_instance()

        # Check context
        with override_settings(RICHIE_LTI_PROVIDERS=lti_providers):
            context = plugin_instance.render(global_context, model_instance, None)

        self.assertEqual(context["instance"], model_instance)
        widget_props = json.loads(context["widget_props"])
        self.assertEqual(widget_props["automatic_resizing"], resizing)
        self.assertEqual(widget_props["url"], "http://localhost:8060/lti/videos/")
        self.assertEqual(widget_props["content_parameters"], "test_content")
        mock_params.assert_called_once_with(edit=edit)

        # Check rendered url is correct after save and sanitize
        mock_params.reset_mock()
        renderer = ContentRenderer(request=request)
        with override_settings(RICHIE_LTI_PROVIDERS=lti_providers):
            html = renderer.render_plugin(model_instance, global_context)

        self.assertIn(url, html)
        self.assertIn("test_content", html)
        self.assertIn('style="padding-bottom: 33.12%"', html)
        mock_params.assert_called_once_with(edit=edit)
