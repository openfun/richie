"""Testing DjangoCMS plugin declaration for Richie's LTI consumer plugin."""
from unittest import mock

from django.test import TestCase
from django.test.client import RequestFactory

from cms.api import add_plugin
from cms.models import Placeholder
from cms.plugin_rendering import ContentRenderer

from richie.plugins.lti_consumer.cms_plugins import LTIConsumerPlugin
from richie.plugins.lti_consumer.factories import LTIConsumerFactory


class LTIConsumerPluginTestCase(TestCase):
    """Test suite for the LTI consumer plugin."""

    def test_cms_plugins_lti_consumer_context_and_html(self):
        """
        Instanciating this plugin with an instance should populate the context
        and render in the template.
        """
        placeholder = Placeholder.objects.create(slot="test")

        lti_consumer = LTIConsumerFactory()

        model_instance = add_plugin(
            placeholder,
            LTIConsumerPlugin,
            "en",
            url=lti_consumer.url,
            lti_provider_id=lti_consumer.lti_provider_id,
        )
        plugin_instance = model_instance.get_plugin_class_instance()
        context = plugin_instance.render({}, model_instance, None)

        # Check if instance is in context
        self.assertEqual(model_instance, context["instance"])

        # Get generated html for LTI consumer url
        renderer = ContentRenderer(request=RequestFactory())
        html = renderer.render_plugin(model_instance, {})

        # Check rendered url is correct after save and sanitize
        self.assertIn(lti_consumer.url, html)
        self.assertIn("student", html)

    @mock.patch(
        "richie.plugins.lti_consumer.models.LTIConsumer.authorize",
        return_value={
            "Authorization": (
                'OAuth oauth_nonce="80966668944732164491378916897", oauth_timestamp="1378916897", '
                'oauth_version="1.0", oauth_signature_method="HMAC-SHA1", '
                'oauth_consumer_key="InsecureOauthConsumerKey", '
                'oauth_signature="frVp4JuvT1mVXlxktiAUjQ7%2F1cw%3D"'
            )
        },
    )
    def test_cms_plugins_get_lti_consumer_widget_props(self, _):
        """
        Verify that LTI content consumption parameters are correctly built through
        content_parameters wrapper
        """
        lti_consumer = LTIConsumerFactory()
        expected_content_parameters = {
            "lti_message_type": lti_consumer.lti_provider.get("display_name"),
            "lti_version": "LTI-1p0",
            "resource_link_id": str(lti_consumer.id),
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "",
            "roles": "instructor",
            "oauth_consumer_key": lti_consumer.lti_provider.get("oauth_consumer_key"),
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1378916897",
            "oauth_nonce": "80966668944732164491378916897",
            "oauth_version": "1.0",
            "oauth_signature": "frVp4JuvT1mVXlxktiAUjQ7/1cw=",
        }
        expected_widget_props = {
            "url": lti_consumer.url,
            "content_parameters": expected_content_parameters,
            "automatic_resizing": True,
        }

        self.assertDictEqual(
            expected_widget_props,
            LTIConsumerPlugin.get_lti_consumer_widget_props(lti_consumer, edit=True),
        )
