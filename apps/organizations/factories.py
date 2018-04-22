"""
Organization factories
"""
from django.utils.text import slugify

import factory

from .models import Organization


class OrganizationFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful organizations in our tests.
    """
    class Meta:
        model = Organization

    # Don't automatically create the page as there are many ways to do it: with or without parent,
    # multilingual or not, with or without plugins, etc. It is better to let each test do what
    # it needs to do.
    name = factory.Faker('catch_phrase')
    logo = factory.django.ImageField(width=180, height=100)

    @factory.lazy_attribute
    def code(self):
        """
        Since `name` is required, let's just slugify it to get a meaningful code (and keep it
        below 100 characters)
        """
        return slugify(self.name)[:100]
