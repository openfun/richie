"""
Factory tests
"""

from django.test import TestCase, override_settings

from richie.plugins.lti_consumer.factories import LTIConsumerFactory


class LTIConsumerFactoriesTestCase(TestCase):
    """Tests for the LTIConsumer factory"""

    @override_settings(
        RICHIE_LTI_PROVIDERS={
            "lti_provider_test": {
                "base_url": "http://localhost:8060/lti/videos/",
                "is_base_url_regex": False,
            }
        }
    )
    def test_lti_consumer_factories_create_with_lti_provider(self):
        """
        The url field should be computed by the model's "save" method if an
        LTI provider is defined.
        """
        lti_consumer = LTIConsumerFactory()
        self.assertIn(lti_consumer.url, "http://localhost:8060/lti/videos/")

    def test_lti_consumer_factories_create_without_lti_provider(self):
        """The url field should be set to a random value for a custom provider."""
        lti_consumer = LTIConsumerFactory(lti_provider_id=None)
        self.assertIsNotNone(lti_consumer.url)
