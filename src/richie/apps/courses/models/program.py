"""
Declare and configure the models for the program part
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension
from ..defaults import PROGRAMS_PAGE


class Program(BasePageExtension):
    """
    The program extension represents and records a program.
    """

    PAGE = PROGRAMS_PAGE

    class Meta:
        db_table = "richie_program"
        ordering = ["-pk"]
        verbose_name = _("program")
        verbose_name_plural = _("programs")

    def __str__(self):
        """Human representation of a program"""
        model = self._meta.verbose_name.title()
        name = self.extended_object.get_title()
        return f"{model:s}: {name:s}"


class ProgramPluginModel(CMSPlugin):
    """
    Program plugin model handles the relation between the ProgramPluginModel
    and its program instance
    """

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="program_plugins",
        limit_choices_to={"publisher_is_draft": True, "program__isnull": False},
    )

    class Meta:
        db_table = "richie_program_plugin"
        verbose_name = _("program plugin")
        verbose_name_plural = _("program plugins")

    def __str__(self):
        """Human representation of a page plugin"""
        return self.page.get_title()


extension_pool.register(Program)
