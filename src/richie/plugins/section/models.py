"""
Section plugin models
"""
from django.db import models
from django.utils.encoding import python_2_unicode_compatible
from django.utils.text import Truncator

from cms.models.pluginmodel import CMSPlugin


@python_2_unicode_compatible
class Section(CMSPlugin):
    """
    Section plugin model

    A Section aims to enforce a distinct title from its content

    It should be used as filling a title then adding sub content plugins.
    """

    title = models.CharField(max_length=255)

    def __str__(self):
        return Truncator(self.title).words(6, truncate="...")
