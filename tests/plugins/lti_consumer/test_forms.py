"""
Forms tests
"""
from unittest import mock

from django.test import TestCase, override_settings

import exrex

from richie.plugins.lti_consumer.forms import LTIConsumerForm


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


class LTIConsumerFormTestCase(TestCase):
    """Tests for the LTI consumer forms"""

    def test_forms_lti_consumer_predefined_providers(self):
        """
        Verify LTI consumer form lists predefined providers
        """
        self.assertListEqual(
            LTIConsumerForm().fields["lti_provider_id"].widget.choices,
            [
                (None, "Custom provider configuration"),
                ("lti_provider_test", "LTI Provider Test Video"),
            ],
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
                {"url": ["Please fill this field"]},
            ),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                    "shared_secret": "InsecureSharedSecret",
                },
                {"oauth_consumer_key": ["Please fill this field"]},
            ),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                    "oauth_consumer_key": "InsecureOauthConsumerKey",
                },
                {"shared_secret": ["Please fill this field"]},
            ),
            (
                {"lti_provider_id": "", "url": "http://example.com"},
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

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    @mock.patch.object(
        exrex, "getone", return_value="http://localhost:8060/lti/videos/1234abcd-1"
    )
    def test_forms_lti_consumer_url_regex_match(self, _mock_getone):
        """
        The url field should match the regex url if a predefined LTI provider is
        used and has a regex url.
        """
        data = {"lti_provider_id": "lti_provider_test", "url": "http://invalid.com"}
        form = LTIConsumerForm(data=data)
        self.assertFalse(form.is_valid())
        self.assertDictEqual(
            form.errors,
            {
                "url": [
                    (
                        "The url is not valid for this provider. "
                        'It should be of the form "http://localhost:8060/lti/videos/1234abcd-1".'
                    )
                ]
            },
        )

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings(is_regex=False))
    def test_forms_lti_consumer_url_not_regex_included(self):
        """
        The url field should include the provider's base url if a predefined LTI provider
        is used and has a regex url.
        """
        data = {"lti_provider_id": "lti_provider_test", "url": "http://invalid.com"}
        form = LTIConsumerForm(data=data)
        self.assertFalse(form.is_valid())
        self.assertDictEqual(
            form.errors,
            {
                "url": [
                    (
                        "The url is not valid for this provider. "
                        'It should start with "http://localhost:8060/lti/videos/".'
                    )
                ]
            },
        )
