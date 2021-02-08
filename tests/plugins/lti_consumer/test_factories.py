"""
Factory tests
"""
from django.test import TestCase

from richie.plugins.lti_consumer.factories import LTIConsumerFactory


class LTIConsumerFactoriesTestCase(TestCase):
    """Tests for the LTIConsumer factory"""

    def test_factories_lti_consumer_create_success(self):
        """Factory creation success."""
        lti_consumer = LTIConsumerFactory()
        self.assertIsNotNone(lti_consumer.url)
