"""
Simple text plugin models
"""
from django.db import models
from django.utils.encoding import force_text
from django.utils.html import strip_tags
from django.utils.text import Truncator
from django.utils.translation import ugettext_lazy as _

from cms.models.pluginmodel import CMSPlugin


class PlainText(CMSPlugin):
    """
    Plain text plugin model.

    To be used for fields that don't allow any HTML formatting.
    """

    body = models.TextField(_("plain text"))

    def __str__(self):
        return Truncator(strip_tags(self.body)).words(6, truncate="...")

    def __init__(self, *args, **kwargs):
        super(PlainText, self).__init__(*args, **kwargs)
        self.body = force_text(self.body)
