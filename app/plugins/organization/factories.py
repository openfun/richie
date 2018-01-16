
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.template.defaultfilters import slugify

import factory
from filer.models.imagemodels import Image

from fun_cms.common.factories import FilerImageFactory

from .models import Organization, OrganizationList


class OrganizationFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of Organization for testing.
    """

    class Meta:
        model = Organization

    name = factory.Faker('sentence', nb_words=8)
    short_name = factory.Faker('sentence', nb_words=4)
    code = factory.LazyAttribute(lambda o:slugify(o.name))
    certificate_logo = factory.django.ImageField()
    logo = factory.django.ImageField()
    is_detail_page_enabled = factory.Faker('pybool')
    is_obsolete = factory.Faker('pybool')
    slug = factory.LazyAttribute(lambda o:slugify(o.name))
    banner = factory.django.ImageField()
    description = factory.Faker('text')
    partnership_level = 'Partner'
    score = factory.Faker('pyint')

class OrganizationListFactory(factory.django.DjangoModelFactory):
    
    class Meta:
        model = OrganizationList
    
    limit = factory.Faker('random_int', min=1, max=30)
