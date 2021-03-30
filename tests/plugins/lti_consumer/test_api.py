"""
Tests for LTI Consumer plugin api
"""

import json
from unittest import mock

from django.test import TestCase

from cms.api import add_plugin
from cms.models import Placeholder

from richie.plugins.lti_consumer.cms_plugins import LTIConsumerPlugin
from richie.plugins.lti_consumer.factories import LTIConsumerFactory
from richie.plugins.lti_consumer.models import LTIConsumer


class LtiConsumerPluginApiTestCase(TestCase):
    """Tests requests on LTI Consumer plugin API endpoints."""

    @mock.patch.object(
        LTIConsumer, "get_content_parameters", return_value="test_content"
    )
    def test_lti_consumer_api_get_context(self, mock_params):
        """
        Instianciating this plugin and make a request to its API endpoint
        to get context
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

        response = self.client.get(
            f"/api/v1.0/plugins/lti-consumer/{model_instance.pk}/context/"
        )
        content = json.loads(response.content)

        self.assertEqual(response.status_code, 200)
        self.assertIn(content["url"], lti_consumer.url)
        self.assertEqual(content["automatic_resizing"], lti_consumer.automatic_resizing)
        self.assertEqual(content["content_parameters"], "test_content")
        mock_params.assert_called_once()

    def test_lti_consumer_api_get_context_to_unknown_placeholder(self):
        """
        Making a context API request to an unknown plugin instance should return
        a 404 error response.
        """
        response = self.client.get(
            "/api/v1.0/plugins/lti-consumer/15003/context/", follow=True
        )
        self.assertEqual(response.status_code, 404)
