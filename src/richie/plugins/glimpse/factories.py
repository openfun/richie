"""
Glimpse CMS plugin factories
"""
import factory

from .defaults import GLIMPSE_VARIANTS
from .models import Glimpse


class GlimpseFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of Glimpse for testing.
    """

    class Meta:
        model = Glimpse

    title = factory.Faker("sentence", nb_words=6)
    variant = GLIMPSE_VARIANTS[0][0]
    image = factory.SubFactory("richie.apps.core.factories.FilerImageFactory")
    content = factory.Faker("text", max_nb_chars=200)
