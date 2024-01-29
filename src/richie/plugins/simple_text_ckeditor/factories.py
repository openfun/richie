"""
SimpleText CMS plugin factories
"""

import factory

from .models import SimpleText


class SimpleTextFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of SimpleText for testing.
    """

    class Meta:
        model = SimpleText

    body = factory.Faker("text", max_nb_chars=42)
