"""
LTIConsumer CMS plugin factories
"""

from django.conf import settings

import factory
import factory.fuzzy

from .models import LTIConsumer


class LTIConsumerFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of LTIConsumer for testing.
    """

    class Meta:
        model = LTIConsumer

    lti_provider_id = factory.fuzzy.FuzzyChoice(
        getattr(settings, "RICHIE_LTI_PROVIDERS", {}).keys()
    )
    is_automatic_resizing = factory.fuzzy.FuzzyChoice([True, False])
    inline_ratio = factory.fuzzy.FuzzyFloat(0.1, 10)

    @factory.lazy_attribute
    def url(self):
        """Generates a random url in accordance with the LTI provider."""
        if self.lti_provider_id:
            # Let the "save" method generate by returning None
            return None

        return factory.Faker("url").evaluate(
            None, None, {"locale": settings.LANGUAGE_CODE}
        )
