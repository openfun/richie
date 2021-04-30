"""
Tests for LTI Consumer plugin api
"""

import json
from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory, TestCase
from django.test.utils import override_settings

from cms.api import add_plugin
from cms.models import Placeholder
from cms.toolbar.toolbar import CMSToolbar

from richie.plugins.lti_consumer.api import LTIConsumerViewsSet
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

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": "mymaster/redis-sentinel:26379,redis-sentinel:26379/0",
                "OPTIONS": {"CLIENT_CLASS": "richie.apps.core.cache.SentinelClient"},
            },
            "memory_cache": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            },
        }
    )
    @mock.patch.object(
        LTIConsumer, "get_content_parameters", return_value="test_content"
    )
    def test_lti_consumer_view_set_get_context_method_is_cached(self, mock_params):
        """
        If "memory_cache" is defined, get_context method is cached
        for 5 minutes to optimize db accesses without return
        stale oauth credentials.
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
        request = RequestFactory().get("/")
        request.user = AnonymousUser()
        request.session = {}
        request.toolbar = CMSToolbar(request)
        view_set = LTIConsumerViewsSet()

        with self.assertNumQueries(1):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_called_once()

        mock_params.reset_mock()

        with self.assertNumQueries(0):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_not_called()
