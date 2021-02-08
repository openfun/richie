"""
Model tests
"""
from unittest import mock

from django.test import TestCase, override_settings

from richie.plugins.lti_consumer.models import LTIConsumer


class LTIConsumerModelsTestCase(TestCase):
    """Model tests case"""

    def test_models_lti_consumer_url(self):
        """
        Verify that url is stored when a predefined LTI provider is used, even for wrong settings
        """
        for lti_settings in (
            {
                "is_base_url_regex": False,
            },
            {
                "base_url": "",
                "is_base_url_regex": False,
            },
            {
                "base_url": "http://localhost:8060/lti/videos/path",
                "is_base_url_regex": False,
            },
            {
                "base_url": "http://localhost:8060/lti/videos/[0-9a-f]{8}-[0-9a-f]",
                "is_base_url_regex": False,
            },
            {
                "is_base_url_regex": True,
            },
            {
                "base_url": "",
                "is_base_url_regex": True,
            },
            {
                "base_url": "http://localhost:8060/lti/videos/path",
                "is_base_url_regex": True,
            },
        ):
            with self.subTest(lti_settings=lti_settings):
                with override_settings(
                    RICHIE_LTI_PROVIDERS={"lti_provider_test": lti_settings}
                ):
                    instance = LTIConsumer(lti_provider_id="lti_provider_test")
                    instance.save()
                    self.assertEqual(
                        instance.url, instance.lti_provider.get("base_url", "")
                    )

    @override_settings(
        RICHIE_LTI_PROVIDERS={
            "lti_provider_test": {
                "base_url": "http://localhost:8060/lti/videos/[0-9a-f]{8}-[0-9a-f]",
                "is_base_url_regex": True,
            }
        }
    )
    def test_models_lti_consumer_url_regex(self):
        """
        Verify that a regex url is generated when a predefined LTI provider is used
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        self.assertRegex(instance.url, instance.lti_provider.get("base_url"))

    def test_models_lti_consumer_auth_parameters_no_edit_mode(self):
        """
        Verify that student LTI authentication parameters are correctly built without edit mode
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        expected_auth_parameters = {
            "lti_message_type": instance.lti_provider.get("display_name"),
            "lti_version": "LTI-1p0",
            "resource_link_id": str(instance.id),
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "",
            "roles": "student",
        }
        self.assertDictEqual(expected_auth_parameters, instance.auth_parameters())

    def test_models_lti_consumer_auth_parameters_edit_mode(self):
        """
        Verify that instructor LTI authentication parameters are correctly built with edit mode
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        expected_auth_parameters = {
            "lti_message_type": instance.lti_provider.get("display_name"),
            "lti_version": "LTI-1p0",
            "resource_link_id": str(instance.id),
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "",
            "roles": "instructor",
        }
        self.assertDictEqual(
            expected_auth_parameters, instance.auth_parameters(edit=True)
        )

    def test_models_lti_consumer_authorize(self):
        """
        Verify that oauth authentication returns headers
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        expected_auth_headers_keys = (
            "oauth_nonce",
            "oauth_timestamp",
            "oauth_version",
            "oauth_consumer_key",
            "oauth_signature",
        )
        auth_headers = instance.authorize()
        for expected_key in expected_auth_headers_keys:
            self.assertIn(expected_key, auth_headers.get("Authorization"))

    def test_models_lti_consumer_build_content_parameters_edit_mode(self):
        """
        Verify that LTI content consumption parameters are correctly built
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        auth_headers = {
            "Authorization": (
                'OAuth oauth_nonce="80966668944732164491378916897", oauth_timestamp="1378916897", '
                'oauth_version="1.0", oauth_signature_method="HMAC-SHA1", '
                'oauth_consumer_key="InsecureOauthConsumerKey", '
                'oauth_signature="frVp4JuvT1mVXlxktiAUjQ7%2F1cw%3D"'
            )
        }
        expected_content_parameters = {
            "lti_message_type": instance.lti_provider.get("display_name"),
            "lti_version": "LTI-1p0",
            "resource_link_id": str(instance.id),
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "",
            "roles": "instructor",
            "oauth_consumer_key": "InsecureOauthConsumerKey",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1378916897",
            "oauth_nonce": "80966668944732164491378916897",
            "oauth_version": "1.0",
            "oauth_signature": "frVp4JuvT1mVXlxktiAUjQ7/1cw=",
        }
        self.assertDictEqual(
            expected_content_parameters,
            instance.build_content_parameters(auth_headers, edit=True),
        )

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
    def test_models_lti_consumer_content_parameters(self, _):
        """
        Verify that LTI content consumption parameters are correctly built through the
        content_parameters wrapper
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        expected_content_parameters = {
            "lti_message_type": instance.lti_provider.get("display_name"),
            "lti_version": "LTI-1p0",
            "resource_link_id": str(instance.id),
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "",
            "roles": "instructor",
            "oauth_consumer_key": instance.lti_provider.get("oauth_consumer_key"),
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1378916897",
            "oauth_nonce": "80966668944732164491378916897",
            "oauth_version": "1.0",
            "oauth_signature": "frVp4JuvT1mVXlxktiAUjQ7/1cw=",
        }
        self.assertDictEqual(
            expected_content_parameters, instance.content_parameters(edit=True)
        )
