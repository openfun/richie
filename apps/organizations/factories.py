"""
Organization factories
"""
from django.utils.text import slugify

from cms.api import create_page
import factory

from .models import Organization


class OrganizationFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful organization page extensions
    in our tests.
    """

    class Meta:
        model = Organization
        exclude = ["title"]

    logo = factory.django.ImageField(width=180, height=100)
    title = factory.Faker("catch_phrase")

    @factory.lazy_attribute
    def extended_object(self):
        """
        Automatically create a related page with a random title
        """
        return create_page(
            self.title, "organizations/cms/organization_detail.html", "en"
        )

    @factory.lazy_attribute
    def code(self):
        """
        Since `name` is required, let's just slugify it to get a meaningful code (and keep it
        below 100 characters)
        """
        return slugify(self.title)[:100]
