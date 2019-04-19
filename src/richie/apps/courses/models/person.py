"""
Declare and configure the model for the person application
"""
from django.apps import apps
from django.db import models
from django.db.models import Prefetch
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models import Title
from cms.models.pluginmodel import CMSPlugin
from parler.fields import TranslatedField
from parler.models import TranslatableModel, TranslatedFieldsModel

from ...core.models import BasePageExtension, PagePluginMixin


class PersonTitle(TranslatableModel):
    """
    PersonTitle define i18n enabled people titles and their abbreviations
    Instances of this models should only be created by CMS administrators
    """

    title = TranslatedField()
    abbreviation = TranslatedField()

    class Meta:
        db_table = "richie_person_title"
        verbose_name = _("person title")

    def __str__(self):
        """Human representation of a person title"""
        return "{model}: {title} ({abbreviation})".format(
            model=self._meta.verbose_name.title(),
            title=self.title,
            abbreviation=self.abbreviation,
        )


class PersonTitleTranslation(TranslatedFieldsModel):
    """
    This model stores translations for the above PersonTitle model.
    """

    master = models.ForeignKey(
        PersonTitle, related_name="translations", on_delete=models.CASCADE
    )
    title = models.CharField(_("Title"), max_length=200)
    abbreviation = models.CharField(_("Title abbreviation"), max_length=10)

    class Meta:
        db_table = "richie_person_title_translation"
        unique_together = ("language_code", "master")
        verbose_name = _("person title translation")

    def __str__(self):
        """Human representation of a person title translation."""
        return "{title} ({abbreviation}) [{language}]".format(
            title=self.title,
            abbreviation=self.abbreviation,
            language=self.language_code,
        )

    # pylint: disable=arguments-differ
    def save(self, *args, **kwargs):
        """Enforce validation of each instance when it is saved."""
        self.full_clean()
        super().save(*args, **kwargs)


class Person(BasePageExtension):
    """
    The person page extension represents and records people information.
    It could be a course or news article author.

    This model should be used to record structured data about the person whereas the
    associated page object is where we record the less structured information to display on the
    page to present the person.
    """

    first_name = models.CharField(max_length=200, verbose_name=_("First name"))
    last_name = models.CharField(max_length=200, verbose_name=_("Last name"))

    person_title = models.ForeignKey(
        "PersonTitle",
        related_name="persons",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )

    ROOT_REVERSE_ID = "persons"
    TEMPLATE_DETAIL = "courses/cms/person_detail.html"

    class Meta:
        db_table = "richie_person"
        verbose_name = _("person")

    def __str__(self):
        """Human representation of a person"""
        return "{model}: {title} ({full_name})".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
            full_name=self.get_full_name(),
        )

    def save(self, *args, **kwargs):
        """
        Enforce validation on each instance save
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def get_full_name(self):
        """
        Return person's full name
        """
        person_title = (
            "{:s} ".format(self.person_title.title) if self.person_title else ""
        )

        return "{person_title}{first_name} {last_name}".format(
            person_title=person_title,
            first_name=self.first_name,
            last_name=self.last_name,
        )

    def get_courses(self, language=None):
        """
        Return a query to get the courses related to this person ie for which a plugin for
        this person is linked to the course page on the "course_team" placeholder.
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
            "extended_object__placeholders__slot": "course_team",
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
        plugin for this person is linked to the blogpost page on the "author"
        placeholder.
        """
        is_draft = self.extended_object.publisher_is_draft
        person = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = (
            "extended_object__placeholders__cmsplugin__courses_personpluginmodel__page"
        )
        filter_dict = {
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__slot": "author",
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

    def __str__(self):
        """Human representation of a person plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


extension_pool.register(Person)
