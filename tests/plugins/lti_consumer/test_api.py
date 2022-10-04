"""
Tests for LTI Consumer plugin api
"""

import json
import random
import uuid
from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from django.test.utils import override_settings
from django.utils import translation

from cms.api import add_plugin
from cms.models import PagePermission, Placeholder
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.toolbar import CMSToolbar

from richie.apps.core.factories import UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.plugins.lti_consumer.api import LTIConsumerViewsSet
from richie.plugins.lti_consumer.cms_plugins import LTIConsumerPlugin
from richie.plugins.lti_consumer.factories import LTIConsumerFactory
from richie.plugins.lti_consumer.models import LTIConsumer


class LtiConsumerPluginApiTestCase(CMSTestCase):
    """Tests requests on LTI Consumer plugin API endpoints."""

    @mock.patch.object(
        LTIConsumer, "get_content_parameters", return_value="test_content"
    )
    def test_lti_consumer_api_get_context(self, mock_params):
        """
        Instantiating this plugin and make a request to its API endpoint
        to get context
        """
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        lti_consumer = LTIConsumerFactory()
        model_instance = add_plugin(
            placeholder,
            LTIConsumerPlugin,
            "en",
            url=lti_consumer.url,
            lti_provider_id=lti_consumer.lti_provider_id,
        )

        user_id = str(uuid.uuid4())
        response = self.client.get(
            f"/api/v1.0/plugins/lti-consumer/{model_instance.pk}/context/",
            {"user_id": user_id},
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertIn(content["url"], lti_consumer.url)
        self.assertTrue(content["is_automatic_resizing"])
        self.assertEqual(content["content_parameters"], "test_content")
        mock_params.assert_called_once_with(user_infos={"user_id": user_id}, edit=False)

    @mock.patch.object(
        LTIConsumer, "get_content_parameters", return_value="test_content"
    )
    def test_lti_consumer_api_get_context_edit_all_permissions(self, mock_params):
        """
        A query with a user in edition mode and with all permissions required to change
        the plugin should get the instructor role.
        """
        user = UserFactory()
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        lti_consumer = LTIConsumerFactory()
        model_instance = add_plugin(
            placeholder,
            LTIConsumerPlugin,
            "en",
            url=lti_consumer.url,
            lti_provider_id=lti_consumer.lti_provider_id,
        )

        # Add all necessary model and object level permissions
        self.add_permission(user, "change_lticonsumer")
        self.add_permission(user, "change_page")
        PagePermission.objects.create(
            page=placeholder.page,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        request = RequestFactory().get(
            f"/api/v1.0/plugins/lti-consumer/{model_instance.pk}/context/",
            {
                "user_id": user.username,
                "lis_person_sourcedid": user.username,
                "lis_person_name_given:": user.username,
                "lis_person_contact_email_primary": user.email,
            },
        )
        request.user = user
        request.session = {}
        request.toolbar = CMSToolbar(request)
        request.toolbar.edit_mode_active = True
        view_set = LTIConsumerViewsSet()

        response = view_set.get_context(request, "v1.0", model_instance.pk)
        self.assertEqual(response.status_code, 200)

        mock_params.assert_called_once_with(
            user_infos={
                "user_id": user.username,
                "lis_person_sourcedid": user.username,
                "lis_person_name_given:": user.username,
                "lis_person_contact_email_primary": user.email,
            },
            edit=True,
        )

    @mock.patch.object(
        LTIConsumer, "get_content_parameters", return_value="test_content"
    )
    def test_lti_consumer_api_get_context_edit_missing_permissions(self, mock_params):
        """
        A query with a user in edition mode but with missing permissions to change
        the plugin should not get the instructor role.
        """
        user = UserFactory()
        page = create_i18n_page("A page")
        placeholder = page.placeholders.get(slot="maincontent")

        lti_consumer = LTIConsumerFactory()
        model_instance = add_plugin(
            placeholder,
            LTIConsumerPlugin,
            "en",
            url=lti_consumer.url,
            lti_provider_id=lti_consumer.lti_provider_id,
        )

        # Add all necessary model and object level permissions except one
        skip = random.choice(range(3))
        if skip != 0:
            self.add_permission(user, "change_lticonsumer")
        if skip != 1:
            self.add_permission(user, "change_page")
        if skip != 2:
            PagePermission.objects.create(
                page=placeholder.page,
                user=user,
                can_add=False,
                can_change=True,
                can_delete=False,
                can_publish=False,
                can_move_page=False,
            )

        request = RequestFactory().get(
            f"/api/v1.0/plugins/lti-consumer/{model_instance.pk}/context/",
            {
                "user_id": user.username,
                "lis_person_sourcedid": user.username,
                "lis_person_name_given:": user.username,
                "lis_person_contact_email_primary": user.email,
            },
        )
        request.user = user
        request.session = {}
        request.toolbar = CMSToolbar(request)
        request.toolbar.edit_mode_active = True
        view_set = LTIConsumerViewsSet()

        response = view_set.get_context(request, "v1.0", model_instance.pk)
        self.assertEqual(response.status_code, 200)

        mock_params.assert_called_once_with(
            user_infos={
                "user_id": user.username,
                "lis_person_sourcedid": user.username,
                "lis_person_name_given:": user.username,
                "lis_person_contact_email_primary": user.email,
            },
            edit=False,
        )

    def test_lti_consumer_api_get_context_to_unknown_placeholder(self):
        """
        Making a context API request to an unknown plugin instance should return
        a 404 error response.
        """
        user_id = str(uuid.uuid4())
        response = self.client.get(
            "/api/v1.0/plugins/lti-consumer/15003/context/",
            {"user_id": user_id},
            follow=True,
        )
        self.assertEqual(response.status_code, 404)

    def test_lti_consumer_api_get_context_without_user_id(self):
        """
        Making a context API request without providing user_id should return a 400 response
        """
        response = self.client.get(
            "/api/v1.0/plugins/lti-consumer/15003/context/", follow=True
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content), {"user_id": ["This parameter is required."]}
        )

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
    def test_lti_consumer_api_get_context_method_is_cached(self, mock_params):
        """
        If "memory_cache" is defined, get_context method is cached
        for 5 minutes to optimize db accesses without returning
        stale oauth credentials.
        """

        def create_request(data):
            request = RequestFactory().get("/", data)
            request.user = AnonymousUser()
            request.session = {}
            request.toolbar = CMSToolbar(request)
            return request

        placeholder = Placeholder.objects.create(slot="test")
        user_id = str(uuid.uuid4())

        request = create_request({"user_id": user_id})
        view_set = LTIConsumerViewsSet()
        lti_consumer = LTIConsumerFactory()
        model_instance = add_plugin(
            placeholder,
            LTIConsumerPlugin,
            "en",
            url=lti_consumer.url,
            lti_provider_id=lti_consumer.lti_provider_id,
        )

        with self.assertNumQueries(1):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_called_once_with(user_infos={"user_id": user_id}, edit=False)
        mock_params.reset_mock()

        with self.assertNumQueries(0):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_not_called()

        # Check that cache is set separately for each language
        translation.activate("fr")
        with self.assertNumQueries(1):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_called_once_with(user_infos={"user_id": user_id}, edit=False)
        mock_params.reset_mock()

        with self.assertNumQueries(0):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_not_called()
        translation.deactivate()

        # Check that cache is set separately for each user
        [user_1, user_2] = UserFactory.create_batch(2)
        request = create_request({"user_id": user_1.username})
        with self.assertNumQueries(1):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_called_once_with(
            user_infos={"user_id": user_1.username}, edit=False
        )
        mock_params.reset_mock()

        request = create_request({"user_id": user_2.username})
        with self.assertNumQueries(1):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_called_once_with(
            user_infos={"user_id": user_2.username}, edit=False
        )
        mock_params.reset_mock()

        request = create_request({"user_id": user_1.username})
        with self.assertNumQueries(0):
            view_set.get_context(request, "v1.0", model_instance.pk)

        mock_params.assert_not_called()
