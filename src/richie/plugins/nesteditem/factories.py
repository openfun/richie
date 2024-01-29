"""
NestedItem CMS plugin factories
"""

import factory

from .defaults import NESTEDITEM_VARIANTS
from .models import NestedItem


class NestedItemFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of NestedItem for testing.
    """

    class Meta:
        model = NestedItem

    variant = NESTEDITEM_VARIANTS[0][0]
    content = factory.Faker("text", max_nb_chars=84)
