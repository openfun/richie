"""
Declare and configure the models for the courses application
"""
from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, PagePluginMixin


class Subject(BasePageExtension):
    """
    The subject page extension represents and records a thematic in the catalog.

    This model should be used to record structured data about the thematic whereas the
    associated page object is where we record the less structured information to display on the
    page that presents the thematic.
    """

    ROOT_REVERSE_ID = "subjects"
    TEMPLATE_DETAIL = "courses/cms/subject_detail.html"

    class Meta:
        verbose_name = _("subject")

    def __str__(self):
        """Human representation of a subject"""
        return "{model}: {title}".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
        )


class SubjectPluginModel(PagePluginMixin, CMSPlugin):
    """
    Subject plugin model handles the relation between SubjectPlugin
    and their Subject instance
    """

    page = models.ForeignKey(
        Page,
        related_name="subject_plugins",
        limit_choices_to={"publisher_is_draft": True, "subject__isnull": False},
    )

    class Meta:
        verbose_name = _("subject plugin model")

    def __str__(self):
        """Human representation of a page plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


extension_pool.register(Subject)
