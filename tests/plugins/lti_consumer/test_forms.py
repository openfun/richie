"""
Forms tests
"""

from unittest import mock

from django.test import TestCase, override_settings

import exrex

from richie.plugins.lti_consumer.factories import LTIConsumerFactory
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

    def test_lti_consumer_forms_predefined_providers(self):
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

    def test_lti_consumer_forms_clean_errors(self):
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
                    "form_shared_secret": [
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
                    "form_shared_secret": "InsecureSharedSecret",
                },
                {"url": ["Please fill this field"]},
            ),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                    "form_shared_secret": "InsecureSharedSecret",
                },
                {"oauth_consumer_key": ["Please fill this field"]},
            ),
            (
                {
                    "lti_provider_id": "",
                    "url": "http://example.com",
                    "oauth_consumer_key": "InsecureOauthConsumerKey",
                },
                {"form_shared_secret": ["Please fill this field"]},
            ),
            (
                {"lti_provider_id": "", "url": "http://example.com"},
                {
                    "oauth_consumer_key": ["Please fill this field"],
                    "form_shared_secret": ["Please fill this field"],
                },
            ),
        ]:
            with self.subTest(data=data, errors=errors):
                form = LTIConsumerForm(data=data)
                self.assertFalse(form.is_valid())
                self.assertDictEqual(errors, form.errors)

    def test_lti_consumer_forms_clean_valid(self):
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
                    "form_shared_secret": "InsecureSharedSecret",
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
    def test_lti_consumer_forms_url_regex_match(self, _mock_getone):
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
    def test_lti_consumer_forms_url_not_regex_included(self):
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

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    def test_lti_consumer_forms_reset_credentials(self):
        """
        The "oauth_consumer_key" and "shared_secret" fields should be reset when a value
        is set for the "lti_provider_id" field.
        """
        data = {
            "lti_provider_id": None,
            "url": "http://example.com",
            "oauth_consumer_key": "thisIsAtestOauthConsumerKey",
            "form_shared_secret": "thisIsAtestSharedSecre",
        }
        form = LTIConsumerForm(data=data)
        form.is_valid()
        self.assertTrue(form.is_valid())

        lti_consumer = form.save()
        self.assertEqual(lti_consumer.oauth_consumer_key, "thisIsAtestOauthConsumerKey")
        self.assertEqual(lti_consumer.shared_secret, "thisIsAtestSharedSecre")

        modified_data = LTIConsumerForm(instance=lti_consumer).initial
        modified_data.update(
            {
                "lti_provider_id": "lti_provider_test",
                "url": "http://localhost:8060/lti/videos/166d465f-f",
            }
        )
        modified_form = LTIConsumerForm(instance=lti_consumer, data=modified_data)
        modified_form.is_valid()
        self.assertTrue(modified_form.is_valid())

        modified_form.save()
        lti_consumer.refresh_from_db()
        self.assertIsNone(lti_consumer.oauth_consumer_key)
        self.assertIsNone(lti_consumer.shared_secret)

    @override_settings(RICHIE_LTI_PROVIDERS=get_lti_settings())
    def test_lti_consumer_forms_shared_secret_placeholder(self):
        """
        The "form_shared_secret" should act as a proxy to the "shared_secret" field on the model
        and allow hiding the shared secret from the form after creation.
        """
        lti_consumer = LTIConsumerFactory(
            lti_provider_id=None,
            oauth_consumer_key="thisIsAtestOauthConsumerKey",
            shared_secret="thisIsAtestSharedSecret",
        )

        form = LTIConsumerForm(instance=lti_consumer)
        rendered = form.as_p()

        self.assertIn(
            (
                '<input type="password" name="form_shared_secret" '
                'value="%%shared_secret_placeholder%%" onfocus="this.value=&#x27;&#x27;" '
                'maxlength="50" id="id_form_shared_secret">'
            ),
            rendered,
        )
        self.assertNotIn('id="shared_secret"', rendered)
        self.assertNotIn("thisIsAtestSharedSecret", rendered)

        # Submitting the placeholder value for the secret should not
        # impact the field on the model
        data = form.initial
        data["form_shared_secret"] = "%%shared_secret_placeholder%%"

        form = LTIConsumerForm(instance=lti_consumer, data=data)
        form.is_valid()
        self.assertTrue(form.is_valid())

        form.save()
        lti_consumer.refresh_from_db()
        self.assertEqual(lti_consumer.shared_secret, "thisIsAtestSharedSecret")

        # Submitting a new secret should update the corresponding field on the model
        data["form_shared_secret"] = "NewSharedSecret"
        form = LTIConsumerForm(instance=lti_consumer, data=data)
        form.is_valid()
        self.assertTrue(form.is_valid())

        form.save()
        lti_consumer.refresh_from_db()
        self.assertEqual(lti_consumer.shared_secret, "NewSharedSecret")
