"""Testing DjangoCMS plugin declaration for Richie's LTI consumer plugin."""

import random

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase, override_settings
from django.test.client import RequestFactory

from cms.api import add_plugin
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer
from cms.toolbar.toolbar import CMSToolbar

from richie.plugins.lti_consumer.cms_plugins import LTIConsumerPlugin


class LTIConsumerPluginTestCase(TestCase):
    """Test suite for the LTI consumer plugin."""

    def test_lti_consumer_cms_plugins_context_and_html(self):
        """
        Instanciating this plugin with an instance should render the template.
        """
        placeholder = Placeholder.objects.create(slot="test")

        url = "http://localhost:8060/lti/videos/"
        resizing = random.choice([True, False])
        edit = random.choice([True, False])
        lti_providers = {
            "lti_provider_test": {
                "base_url": "http://localhost:8060/lti/videos/",
                "is_base_url_regex": False,
                "is_automatic_resizing": resizing,
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
        renderer = ContentRenderer(request=request)
        with override_settings(RICHIE_LTI_PROVIDERS=lti_providers):
            html = renderer.render_plugin(model_instance, global_context)

        self.assertIn(str(model_instance.pk), html)
        self.assertIn('style="padding-bottom: 33.12%"', html)

    def test_lti_consumer_cms_plugins_context_and_html_missing_inline_ratio(self):
        """
        If the inline ratio is not found in the provider config, it defaults to 16/9.
        """
        placeholder = Placeholder.objects.create(slot="test")

        url = "http://localhost:8060/lti/videos/"
        edit = random.choice([True, False])
        lti_providers = {
            "lti_provider_test": {
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

        renderer = ContentRenderer(request=request)

        with override_settings(RICHIE_LTI_PROVIDERS=lti_providers):
            html = renderer.render_plugin(model_instance, global_context)

        self.assertIn(str(model_instance.pk), html)
        self.assertIn('style="padding-bottom: 56.25%"', html)

    def test_lti_consumer_cms_plugins_context_and_html_manual_inline_ratio(self):
        """
        If the LTI configuration is manual, the inline ratio is set to the value of
        the "inline_ratio" field on the plugin instance.
        """
        placeholder = Placeholder.objects.create(slot="test")

        url = "http://localhost:8060/lti/videos/"
        edit = random.choice([True, False])
        lti_providers = {
            "lti_provider_test": {
                "oauth_consumer_key": "TestOauthConsumerKey",
                "shared_secret": "TestSharedSecret",
                "inline_ratio": 0.75,
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
            lti_provider_id=None,
            inline_ratio=0.2217,
        )

        renderer = ContentRenderer(request=request)

        with override_settings(RICHIE_LTI_PROVIDERS=lti_providers):
            html = renderer.render_plugin(model_instance, global_context)

        self.assertIn(str(model_instance.pk), html)
        self.assertIn('style="padding-bottom: 22.17%"', html)
