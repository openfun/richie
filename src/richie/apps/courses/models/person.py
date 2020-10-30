"""
Declare and configure the model for the person application
"""
from django.apps import apps
from django.db import models
from django.db.models import Prefetch
from django.utils import translation
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models import Title
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, PagePluginMixin
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
        is_draft = self.extended_object.publisher_is_draft
        person = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = (
            "extended_object__placeholders__cmsplugin__courses_personpluginmodel__page"
        )
        filter_dict = {
            "extended_object__node__parent__cms_pages__course__isnull": True,  # exclude snapshots
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: person.extended_object,
        }

        course_model = apps.get_model(app_label="courses", model_name="course")
        # pylint: disable=no-member
        return (
            course_model.objects.filter(**filter_dict)
            .select_related("extended_object")
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="prefetched_titles",
                    queryset=Title.objects.filter(language=language),
                )
            )
            .distinct()
        )

    def get_blogposts(self, language=None):
        """
        Return a query to get the blogposts this person wrote ie for which a
        plugin for this person is linked to the blogpost page via any placeholder.
        """
        is_draft = self.extended_object.publisher_is_draft
        person = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = (
            "extended_object__placeholders__cmsplugin__courses_personpluginmodel__page"
        )
        filter_dict = {
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: person.extended_object,
        }

        blogpost_model = apps.get_model(app_label="courses", model_name="blogpost")
        # pylint: disable=no-member
        return (
            blogpost_model.objects.filter(**filter_dict)
            .select_related("extended_object")
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="prefetched_titles",
                    queryset=Title.objects.filter(language=language),
                )
            )
            .distinct()
        )


class PersonPluginModel(PagePluginMixin, CMSPlugin):
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

    class Meta:
        db_table = "richie_person_plugin"
        verbose_name = _("person plugin")


extension_pool.register(Person)
