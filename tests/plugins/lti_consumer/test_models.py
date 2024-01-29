"""
Model tests
"""

import random
from unittest import mock

from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings

from richie.plugins.lti_consumer.factories import LTIConsumerFactory
from richie.plugins.lti_consumer.models import LTIConsumer


def get_lti_settings(is_regex=True):
    """Returns LTI provider settings to override settings in our tests."""
    suffix = "[0-9a-f]{8}-[0-9a-f]" if is_regex else ""
    return {
        "lti_provider_test": {
            "base_url": f"http://localhost:8060/lti/videos/{suffix:s}",
            "is_base_url_regex": is_regex,
            "oauth_consumer_key": "TestOauthConsumerKey",
            "shared_secret": "TestSharedSecret",
        }
    }


class LTIConsumerModelsTestCase(TestCase):
    """Model tests case"""

    def test_lti_consumer_modelsinline_ratio_min(self):
        """The "inline_ratio" field should not accept values smaller than 0.1"""
        instance = LTIConsumerFactory(inline_ratio=0.09)

        with self.assertRaises(ValidationError) as context:
            instance.full_clean()

        self.assertEqual(
            str(context.exception),
            "{'inline_ratio': ['Ensure this value is greater than or equal to 0.1.']}",
        )

    def test_lti_consumer_modelsinline_ratio_max(self):
        """The "inline_ratio" field should not accept values bigger than 10"""
        instance = LTIConsumerFactory(inline_ratio=10.01)

        with self.assertRaises(ValidationError) as context:
            instance.full_clean()

        self.assertEqual(
            str(context.exception),
            "{'inline_ratio': ['Ensure this value is less than or equal to 10.']}",
        )

    @override_settings(
        RICHIE_LTI_PROVIDERS={"lti_provider_test": {"is_base_url_regex": False}}
    )
    def test_lti_consumer_models_url_create_base_url_missing(self):
        """
        The LTIConsumer model should not fail if the LTI provider has no base url.
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        self.assertEqual(instance.url, "")

    @override_settings(
        RICHIE_LTI_PROVIDERS={
            "lti_provider_test": {"base_url": "", "is_base_url_regex": False}
        }
    )
    def test_lti_consumer_models_url_create_base_url_empty(self):
        """
        The LTIConsumer model should not fail if the LTI provider has an empty base url.
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        instance.save()
        self.assertEqual(instance.url, "")

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    def test_lti_consumer_models_url_create_regex(self):
        """
        Verify that a regex url is generated when a plugin instance is created
        if a predefined LTI provider is used.
        """
        expected_regex = "http://localhost:8060/lti/videos/[0-9a-f]{8}-[0-9a-f]"
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        self.assertEqual(instance.url, "")
        instance.save()
        self.assertRegex(instance.url, expected_regex)

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings(is_regex=False))
    def test_lti_consumer_models_url_create_not_regex(self):
        """
        Verify that the base url is returned when a plugin instance is created
        if a predefined LTI provider is used that is not marked as regex.
        """
        instance = LTIConsumer(lti_provider_id="lti_provider_test")
        self.assertEqual(instance.url, "")
        instance.save()
        expected_url = "http://localhost:8060/lti/videos/"
        self.assertEqual(instance.url, expected_url)

    def test_lti_consumer_models_get_inline_ratio(self):
        """
        The "get_inline_ratio" method should return the "inline_ratio" field value
        or defaults to the lti provider values if there are otherwise returns 0.5625.
        """

        # Should return plugin.inline_ratio
        instance = LTIConsumerFactory(inline_ratio=0.1337)
        self.assertEqual(instance.get_inline_ratio(), 0.1337)

        # Or defaults to lti_provider inline_ratio properties
        with override_settings(
            RICHIE_LTI_PROVIDERS={"lti_provider_test": {"inline_ratio": 0.75}}
        ):
            instance = LTIConsumerFactory(inline_ratio=None)
            self.assertEqual(instance.get_inline_ratio(), 0.75)

        # Otherwise returns 0.5625
        with override_settings(
            RICHIE_LTI_PROVIDERS={"lti_provider_test": {"inline_ratio": None}}
        ):
            instance = LTIConsumerFactory(inline_ratio=None)
            self.assertEqual(instance.get_inline_ratio(), 0.5625)

    def test_lti_consumer_models_get_is_automatic_resizing(self):
        """
        The "get_is_automatic_resizing" method should return the "is_automatic_resizing"
        field value or defaults to the lti provider values if there are
        otherwise returns True.
        """

        plugin_is_automatic_resizing = random.choice([True, False])
        lti_provider_is_automatic_resizing = random.choice([True, False])

        # Should return plugin.is_automatic_resizing
        instance = LTIConsumerFactory(
            is_automatic_resizing=plugin_is_automatic_resizing
        )
        self.assertEqual(
            instance.get_is_automatic_resizing(), plugin_is_automatic_resizing
        )

        # Or defaults to lti_provider is_automatic_resizing properties
        with override_settings(
            RICHIE_LTI_PROVIDERS={
                "lti_provider_test": {
                    "is_automatic_resizing": lti_provider_is_automatic_resizing
                }
            }
        ):
            instance = LTIConsumerFactory(is_automatic_resizing=None)
            self.assertEqual(
                instance.get_is_automatic_resizing(), lti_provider_is_automatic_resizing
            )

        # Otherwise returns True
        with override_settings(
            RICHIE_LTI_PROVIDERS={"lti_provider_test": {"is_automatic_resizing": None}}
        ):
            instance = LTIConsumerFactory(is_automatic_resizing=None)
            self.assertEqual(instance.get_is_automatic_resizing(), True)


# Freeze time to make signatures predictable
@mock.patch(
    "oauthlib.oauth1.rfc5849.generate_nonce",
    return_value="59474787080480293391616018589",
)
@mock.patch("oauthlib.oauth1.rfc5849.generate_timestamp", return_value="1616018589")
class ParametersLTIConsumerModelsTestCase(TestCase):
    """Test LTI parameters including their signature. Time is freezed."""

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    @mock.patch.object(LTIConsumer, "get_resource_link_id", return_value="1234")
    def test_lti_consumer_models_auth_parameters_no_edit_mode_predefined(
        self, _mock_rl, _mock_ts, _mock_nonce
    ):
        """
        Verify that student LTI authentication parameters are correctly built without
        edit mode when credentials come from the settings.
        """
        instance = LTIConsumerFactory(
            lti_provider_id="lti_provider_test",
            url="http://localhost:8060/lti/videos/3cd0bcc4-0",
            # Add credentials on the model to check that they have no influence
            oauth_consumer_key="IgnoredOauthConsumerKey",
            shared_secret="IgnoredSharedSecret",
        )
        expected_content_parameters = {
            "launch_presentation_locale": "en",
            "lti_message_type": "basic-lti-launch-request",
            "lti_version": "LTI-1p0",
            "resource_link_id": "1234",
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "richie@example.com",
            "roles": "student",
            "oauth_consumer_key": "TestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "jGM5+Ikpa/FheK2eU8x3iYwdXbc=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters,
            instance.get_content_parameters(
                user_infos={
                    "user_id": "richie",
                    "lis_person_contact_email_primary": "richie@example.com",
                }
            ),
        )

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    @mock.patch.object(LTIConsumer, "get_resource_link_id", return_value="1234")
    def test_lti_consumer_models_auth_parameters_no_edit_mode_manual(
        self, _mock_rl, _mock_ts, _mock_nonce
    ):
        """
        Verify that student LTI authentication parameters are correctly built without
        edit mode when credentials are setup manually.
        """
        instance = LTIConsumerFactory(
            lti_provider_id=None,
            url="http://localhost:8060/lti/videos/3cd0bcc4-0",
            oauth_consumer_key="ManualTestOauthConsumerKey",
            shared_secret="ManualTestSharedSecret",
        )
        expected_content_parameters = {
            "launch_presentation_locale": "en",
            "lti_message_type": "basic-lti-launch-request",
            "lti_version": "LTI-1p0",
            "resource_link_id": "1234",
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "richie@example.com",
            "roles": "student",
            "oauth_consumer_key": "ManualTestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "YaMv9A7l183tRRzZ5vfZVeUAaQE=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters,
            instance.get_content_parameters(
                user_infos={
                    "user_id": "richie",
                    "lis_person_contact_email_primary": "richie@example.com",
                }
            ),
        )

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    @mock.patch.object(LTIConsumer, "get_resource_link_id", return_value="1234")
    def test_lti_consumer_models_auth_parameters_edit_mode_predefined(
        self, _mock_rl, _mock_ts, _mock_nonce
    ):
        """
        Verify that instructor LTI authentication parameters are correctly built with edit mode
        """
        instance = LTIConsumerFactory(
            lti_provider_id="lti_provider_test",
            url="http://localhost:8060/lti/videos/3cd0bcc4-0",
        )
        expected_content_parameters = {
            "launch_presentation_locale": "en",
            "lti_message_type": "basic-lti-launch-request",
            "lti_version": "LTI-1p0",
            "resource_link_id": "1234",
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "richie@example.com",
            "roles": "instructor",
            "oauth_consumer_key": "TestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "kvuf6xxUKaAA+v4msqDNeRxvgDA=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters,
            instance.get_content_parameters(
                user_infos={
                    "user_id": "richie",
                    "lis_person_contact_email_primary": "richie@example.com",
                },
                edit=True,
            ),
        )

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    @mock.patch.object(LTIConsumer, "get_resource_link_id", return_value="1234")
    def test_lti_consumer_models_auth_parameters_edit_mode_manual(
        self, _mock_rl, _mock_ts, _mock_nonce
    ):
        """
        Verify that instructor LTI authentication parameters are correctly built with
        edit mode when credentials are setup manually.
        """
        instance = LTIConsumerFactory(
            lti_provider_id=None,
            url="http://localhost:8060/lti/videos/3cd0bcc4-0",
            oauth_consumer_key="ManualTestOauthConsumerKey",
            shared_secret="ManualTestSharedSecret",
        )
        expected_content_parameters = {
            "launch_presentation_locale": "en",
            "lti_message_type": "basic-lti-launch-request",
            "lti_version": "LTI-1p0",
            "resource_link_id": "1234",
            "context_id": "example.com",
            "user_id": "richie",
            "lis_person_contact_email_primary": "richie@example.com",
            "roles": "instructor",
            "oauth_consumer_key": "ManualTestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "r4uIBnKjfWaJGQrCRl1AqJLDWpM=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters,
            instance.get_content_parameters(
                user_infos={
                    "user_id": "richie",
                    "lis_person_contact_email_primary": "richie@example.com",
                },
                edit=True,
            ),
        )
