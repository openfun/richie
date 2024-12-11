"""
Declare and configure the models for the program part
"""

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin

from ...core.fields.duration import CompositeDurationField
from ...core.models import BasePageExtension
from .. import defaults
from .category import Category, CategoryPluginModel
from .organization import Organization, OrganizationPluginModel
from .person import Person, PersonPluginModel


class Program(BasePageExtension):
    """
    The program extension represents and records a program.
    """

    PAGE = defaults.PROGRAMS_PAGE

    duration = CompositeDurationField(
        time_units=defaults.TIME_UNITS,
        default_unit=defaults.DEFAULT_TIME_UNIT,
        max_length=80,
        blank=True,
        null=True,
        help_text=_("The program time range."),
    )

    effort = CompositeDurationField(
        time_units=defaults.EFFORT_UNITS,
        default_unit=defaults.DEFAULT_EFFORT_UNIT,
        max_length=80,
        blank=True,
        null=True,
        help_text=_("Total amount of time to complete this program."),
    )

    price = models.DecimalField(
        _("price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        blank=True,
        null=True,
        help_text=_("The price of the program."),
        validators=[MinValueValidator(0)],
    )

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

    @property
    def pt_effort(self):
        """Return effort as a PT string for schema.org metadata."""
        if not self.effort:
            return ""

        (effort, effort_unit) = self.effort
        unit_letter = effort_unit[0].upper()
        return f"PT{effort:d}{unit_letter:s}"

    @property
    def price_with_currency(self):
        """Return price with currency for schema.org metadata."""
        if not self.price:
            return ""

        return f"€{self.price}"

    def get_categories(self, language=None):
        """
        Return the categories linked to the program via a category plugin in any of the
        placeholders on the program detail page, ranked by their `path` to respect the
        order in the categories tree.
        """
        return self.get_direct_related_page_extensions(
            Category, CategoryPluginModel, language=language
        )

    def get_organizations(self, language=None):
        """
        Return the organizations linked to the course via an organization plugin in any
        of the placeholders on the course detail page, ranked by their `path` to respect
        the order in the organizations tree.
        """
        return self.get_direct_related_page_extensions(
            Organization, OrganizationPluginModel, language=language
        )

    def get_persons(self, language=None):
        """
        Return the persons linked to the course via a person plugin in any of the
        placeholders on the course detail page, ranked by their `path` to respect
        the order in the persons tree.
        """
        return self.get_direct_related_page_extensions(
            Person, PersonPluginModel, language=language
        )

    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved
        """
        self.full_clean()
        super().save(*args, **kwargs)


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
