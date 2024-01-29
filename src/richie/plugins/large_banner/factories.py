"""
Large banner CMS plugin factories
"""

import factory

from .defaults import LARGEBANNER_TEMPLATES
from .models import LargeBanner


class LargeBannerFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of LargeBanner for testing.
    """

    class Meta:
        model = LargeBanner

    title = factory.Faker("sentence", nb_words=8)
    background_image = factory.SubFactory(
        "richie.apps.core.factories.FilerImageFactory"
    )
    logo = factory.SubFactory("richie.apps.core.factories.FilerImageFactory")
    logo_alt_text = factory.Faker("sentence", nb_words=5)
    content = factory.Faker("text", max_nb_chars=42)
    template = LARGEBANNER_TEMPLATES[0][0]
