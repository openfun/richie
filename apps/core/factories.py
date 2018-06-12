"""
Core factories
"""

from django.conf import settings
from django.contrib.auth.hashers import make_password

import factory
from filer.models.imagemodels import Image


class UserFactory(factory.django.DjangoModelFactory):
    """
    Create a fake user with Faker.
    """

    class Meta:
        model = settings.AUTH_USER_MODEL

    username = factory.Faker("user_name")
    email = factory.Faker("email")
    password = make_password("password")


class FilerImageFactory(factory.django.DjangoModelFactory):
    """
    Create a Filer Image for filer.fields.image.FilerImageField.
    """

    class Meta:
        model = Image

    owner = factory.SubFactory(UserFactory)
    file = factory.django.ImageField()
    original_filename = factory.Faker("file_name", category="image")
