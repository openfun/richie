"""
Declare and configure the model for the person application
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension
from ..defaults import PERSONS_PAGE


class Person(BasePageExtension):
    """
    The person page extension represents and records people information.
    It could be a course or news article author.

    This model should be used to record structured data about the person whereas the
    associated page object is where we record the less structured information to display on the
    page to present the person.
    """

    PAGE = PERSONS_PAGE

    class Meta:
        db_table = "richie_person"
        verbose_name = _("person")
        verbose_name_plural = _("persons")

    def __str__(self):
        """Human representation of a person."""
        return "{model}: {name}".format(
            name=self.extended_object.get_title(), model=self._meta.verbose_name.title()
        )

    def save(self, *args, **kwargs):
        """
        Enforce validation on each instance save
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def get_courses(self, language=None):
        """
        Return a query to get the courses related to this person ie for which a plugin for
        this person is linked to the course page via any placeholder.
        """
        return self.get_reverse_related_page_extensions(
            "course", language=language
        ).filter(extended_object__node__parent__cms_pages__course__isnull=True)

    def get_blogposts(self, language=None):
        """
        Return a query to get the blogposts this person wrote ie for which a
        plugin for this person is linked to the blogpost page via any placeholder.
        """
        return self.get_reverse_related_page_extensions("blogpost", language=language)


class PersonPluginModel(CMSPlugin):
    """
    Person plugin model handles the relation from PersonPlugin
    to their Person instance
    """

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        limit_choices_to={"publisher_is_draft": True, "person__isnull": False},
        related_name="person_plugins",
    )
    bio = models.TextField(
        _("Custom bio"),
        null=True,
        blank=True,
        default="",
        help_text=_(
            "Optional: provide a custom bio "
            "(if you leave it empty, it will display the person's bio)."
        ),
    )

    class Meta:
        db_table = "richie_person_plugin"
        verbose_name = _("person plugin")
        verbose_name_plural = _("person plugins")

    def __str__(self):
        """Human representation of a page plugin"""
        return self.page.get_title()


extension_pool.register(Person)
