"""
Large banner CMS plugin factories
"""
import factory

from richie.apps.core.factories import FilerImageFactory

from .models import LargeBanner


class LargeBannerFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of LargeBanner for testing.
    """

    class Meta:
        model = LargeBanner

    title = factory.Faker("sentence", nb_words=8)
    background_image = factory.SubFactory(FilerImageFactory)
    logo = factory.SubFactory(FilerImageFactory)
    logo_alt_text = factory.Faker("sentence", nb_words=5)
