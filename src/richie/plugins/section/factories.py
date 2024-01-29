"""
Section CMS plugin factories
"""

import factory

from .defaults import SECTION_TEMPLATES
from .models import Section


class SectionFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of Section for testing.
    """

    class Meta:
        model = Section

    title = factory.Faker("sentence", nb_words=8)
    template = SECTION_TEMPLATES[0][0]
