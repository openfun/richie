"""
PlainText CMS plugin factories
"""

import factory
from djangocms_picture.models import Picture

from richie.apps.core.factories import FilerImageFactory


class PictureFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of SimplePicture for testing.
    """

    class Meta:
        model = Picture

    picture = factory.SubFactory(FilerImageFactory)
