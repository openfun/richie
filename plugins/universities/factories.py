
from django.conf import settings
from django.contrib.auth.hashers import make_password

import factory
from filer.models.imagemodels import Image

from fun_cms.common.factories import FilerImageFactory

from .models import University, UniversitiesList, AllUniversitiesList


class UniversityFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of University for testing.
    """

    class Meta:
        model = University

    name = factory.Faker('sentence', nb_words=8)
    short_name = factory.Faker('sentence', nb_words=4)
    code = factory.Faker('sentence', nb_words=4)
    certificate_logo = factory.django.ImageField()
    logo = factory.django.ImageField()
    detail_page_enabled = factory.Faker('pybool')
    is_obsolete = factory.Faker('pybool')
    slug = factory.Faker('sha1')
    banner = factory.django.ImageField()
    description = factory.Faker('text')
    partnership_level = 'Partner'
    score = factory.Faker('pyint')
    prevent_auto_update = factory.Faker('pybool')

class UniversitiesListFactory(factory.django.DjangoModelFactory):
    
    class Meta:
        model = UniversitiesList
    
    limit = factory.Faker('random_int', min=1, max=30)

class AllUniversitiesListFactory(factory.django.DjangoModelFactory):
    
    class Meta:
        model = AllUniversitiesList
    
    title = factory.Faker('sentence', nb_words=6)
    description = factory.Faker('text', max_nb_chars=500)