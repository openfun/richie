"""
Section CMS plugin factories
"""
import factory

from .models import Section


class SectionFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of Section for testing.
    """

    class Meta:
        model = Section

    title = factory.Faker("sentence", nb_words=8)
