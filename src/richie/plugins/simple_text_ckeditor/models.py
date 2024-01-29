"""
Simple text plugin models
"""

from django.db import models
from django.utils.encoding import force_str
from django.utils.html import strip_tags
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _

from cms.models.pluginmodel import CMSPlugin
from djangocms_text_ckeditor.html import clean_html


class SimpleText(CMSPlugin):
    """
    Simple text plugin model.

    Aim to be used instead of TextPlugin which produces orphan plugin item that
    broke some behavior with constraints from ``CMS_PLACEHOLDER_CONF``.
    """

    body = models.TextField(_("body"))

    def __str__(self):
        return Truncator(strip_tags(self.body)).words(6, truncate="...")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.body = force_str(self.body)

    # pylint: disable=signature-differs
    def save(self, *args, **kwargs):
        # Clean HTML from potential XSS content
        self.body = clean_html(self.body, full=False)

        super().save(*args, **kwargs)
