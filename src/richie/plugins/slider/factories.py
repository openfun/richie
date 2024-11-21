"""
Slider CMS plugin factories
"""

import factory

from .models import SlideItem, Slider


class SliderFactory(factory.django.DjangoModelFactory):
    """
    Factory to create instance of a Slider.
    """

    title = factory.Faker("text", max_nb_chars=20)

    class Meta:
        model = Slider


class SlideItemFactory(factory.django.DjangoModelFactory):
    """
    Factory to create instance of a SlideItem.
    """

    title = factory.Faker("text", max_nb_chars=20)
    content = factory.Faker("text", max_nb_chars=42)
    image = factory.SubFactory("richie.apps.core.factories.FilerImageFactory")
    link_url = factory.Faker("url")
    link_open_blank = factory.Faker("pybool")

    class Meta:
        model = SlideItem
