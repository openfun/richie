"""
Organizations factories
"""
import random

import factory

from .models import Organization


class OrganizationFactory(factory.django.DjangoModelFactory):
    """Organizations factory"""
    class Meta:
        model = Organization

    code = factory.Faker('word')
    name = factory.Faker('sentence', nb_words=random.randrange(2, 6))
    logo = factory.django.ImageField(width=180, height=100)
