"""
PlainText CMS plugin factories
"""

import factory

from .models import PlainText


class PlainTextFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of PlainText for testing.
    """

    class Meta:
        model = PlainText

    body = factory.Faker("text", max_nb_chars=42)
