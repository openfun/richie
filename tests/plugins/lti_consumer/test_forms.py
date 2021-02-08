"""
Forms tests
"""
from django.test import TestCase

from richie.plugins.lti_consumer.forms import LTIConsumerForm


class LTIConsumerFormTestCase(TestCase):
    """Tests for the LTI consumer forms"""

    def test_forms_lti_consumer_predefined_providers(self):
        """
        Verify LTI consumer form lists predefined providers
        """
        self.assertListEqual(
            [
                ("", "---------"),
                ("lti_provider_test", "LTI Provider Test Video"),
            ],
            LTIConsumerForm().fields["lti_provider_id"].widget.choices,
        )

    def test_forms_lti_consumer_clean_errors(self):
        """
        Verify that LTI consumer form is displaying errors with predefined or
        custom provider
        """
        for data, errors in [
            (
                {"lti_provider_id": ""},
                {
                    "lti_provider_id": [
                        "Please choose a predefined provider, or fill fields below"
                    ],
                    "oauth_consumer_key": [
                        "Please choose a predefined provider above, or fill this field"
                    ],
                    "shared_secret": [
                        "Please choose a predefined provider above, or fill this field"
                    ],
                    "url": [
                        "Please choose a predefined provider above, or fill this field"
                    ],
                },
            ),
            (
                {
                    "lti_provider_id": "",
                    "oauth_consumer_key": "InsecureOauthConsumerKey",
                    "shared_secret": "InsecureSharedSecret",
                },
                {
                    "url": ["Please fill this field"],
                },
            ),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                    "shared_secret": "InsecureSharedSecret",
                },
                {
                    "oauth_consumer_key": ["Please fill this field"],
                },
            ),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                    "oauth_consumer_key": "InsecureOauthConsumerKey",
                },
                {
                    "shared_secret": ["Please fill this field"],
                },
            ),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                },
                {
                    "oauth_consumer_key": ["Please fill this field"],
                    "shared_secret": ["Please fill this field"],
                },
            ),
        ]:
            with self.subTest(data=data, errors=errors):
                form = LTIConsumerForm(data=data)
                self.assertFalse(form.is_valid())
                self.assertDictEqual(errors, form.errors)

    def test_forms_lti_consumer_clean_valid(self):
        """
        Verify that LTI consumer form is valid with predefined or custom provider
        """
        for data in [
            ({"lti_provider_id": "lti_provider_test"}),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                    "oauth_consumer_key": "InsecureOauthConsumerKey",
                    "shared_secret": "InsecureSharedSecret",
                }
            ),
        ]:
            with self.subTest(data=data):
                form = LTIConsumerForm(data=data)
                self.assertTrue(form.is_valid())
                self.assertDictEqual(form.errors, {})
                instance = form.save()
                self.assertIsNotNone(instance.url)
