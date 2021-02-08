"""
LTIConsumer CMS plugin factories
"""
import factory

from .models import LTIConsumer


class LTIConsumerFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of LTIConsumer for testing.
    """

    class Meta:
        model = LTIConsumer

    url = factory.Faker("url")
    lti_provider_id = "lti_provider_test"
    oauth_consumer_key = None
    shared_secret = None
