"""
Simple text plugin models
"""
from django.db import models
from django.utils.encoding import force_text, python_2_unicode_compatible
from django.utils.html import strip_tags
from django.utils.text import Truncator
from django.utils.translation import ugettext_lazy as _

from cms.models.pluginmodel import CMSPlugin
from djangocms_text_ckeditor.html import clean_html


@python_2_unicode_compatible
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
        super(SimpleText, self).__init__(*args, **kwargs)
        self.body = force_text(self.body)

    # pylint: disable=arguments-differ
    def save(self, *args, **kwargs):
        # Clean HTML from potential XSS content
        self.body = clean_html(self.body, full=False)

        super(SimpleText, self).save(*args, **kwargs)
