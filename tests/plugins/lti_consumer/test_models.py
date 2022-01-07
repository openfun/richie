"""
Model tests
"""
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

    def test_lti_consumer_models_is_automatic_resizing_default(self):
        """Check fields default values."""
        instance = LTIConsumer.objects.create()
        self.assertTrue(instance.is_automatic_resizing)
        self.assertEqual(instance.inline_ratio, 0.5625)

    def test_lti_consumer_models_inline_ratio_min(self):
        """The "inline_ratio" field should not accept values smaller than 0.1"""
        instance = LTIConsumerFactory(inline_ratio=0.09)

        with self.assertRaises(ValidationError) as context:
            instance.full_clean()

        self.assertEqual(
            str(context.exception),
            "{'inline_ratio': ['Ensure this value is greater than or equal to 0.1.']}",
        )

    def test_lti_consumer_models_inline_ratio_max(self):
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
            "lis_person_contact_email_primary": "",
            "roles": "student",
            "oauth_consumer_key": "TestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "r75pOLpVUzPjOgbenOxE0WNIUbc=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters, instance.get_content_parameters()
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
            "lis_person_contact_email_primary": "",
            "roles": "student",
            "oauth_consumer_key": "ManualTestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "UU7/veFv5lwc7pOhtz0Y0sowywA=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters, instance.get_content_parameters()
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
            "lis_person_contact_email_primary": "",
            "roles": "instructor",
            "oauth_consumer_key": "TestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "XYV4THSMsy4roezJfVEwxhFDF4w=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters, instance.get_content_parameters(edit=True)
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
            "lis_person_contact_email_primary": "",
            "roles": "instructor",
            "oauth_consumer_key": "ManualTestOauthConsumerKey",
            "oauth_nonce": "59474787080480293391616018589",
            "oauth_signature": "22mJEak6wRKx1Egcw4921Vzniw0=",
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": "1616018589",
            "oauth_version": "1.0",
        }

        self.assertDictEqual(
            expected_content_parameters, instance.get_content_parameters(edit=True)
        )
