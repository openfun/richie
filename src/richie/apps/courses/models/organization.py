"""
Declare and configure the models for the courses application
"""
from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Prefetch
from django.utils import translation
from django.utils.text import slugify
from django.utils.translation import ugettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models import Title
from cms.models.pluginmodel import CMSPlugin

from ...core.models import BasePageExtension, PagePluginMixin


class Organization(BasePageExtension):
    """
    The organization page extension represents and records entities that manage courses.
    It could be a university or a training company for example.

    This model should be used to record structured data about the organization whereas the
    associated page object is where we record the less structured information to display on the
    page to present the organization.
    """

    code = models.CharField(
        _("code"), db_index=True, max_length=100, null=True, blank=True
    )

    ROOT_REVERSE_ID = "organizations"
    TEMPLATE_DETAIL = "courses/cms/organization_detail.html"

    class Meta:
        db_table = "richie_organization"
        verbose_name = _("organization")
        ordering = ["-pk"]

    def __str__(self):
        """Human representation of an organization"""
        return "{model}: {name} ({code})".format(
            code=self.code,
            name=self.extended_object.get_title(),
            model=self._meta.verbose_name.title(),
        )

    def clean(self):
        """
        We normalize the code with slugify for better uniqueness
        """
        if self.code:
            # Normalize the code by slugifying and capitalizing it
            self.code = slugify(self.code, allow_unicode=True).upper()
        return super().clean()

    def validate_unique(self, exclude=None):
        """
        We can't rely on a database constraint for uniqueness because pages
        exist in two versions: draft and published.
        """
        if self.code:
            # Check unicity for the version being saved (draft or published)
            is_draft = self.extended_object.publisher_is_draft
            uniqueness_query = self.__class__.objects.filter(
                code=self.code, extended_object__publisher_is_draft=is_draft
            )

            # If the page is being updated, we should exclude it while looking for duplicates
            if self.pk:
                uniqueness_query = uniqueness_query.exclude(pk=self.pk)

            # Raise a ValidationError if the code already exists
            if uniqueness_query.exists():
                raise ValidationError(
                    {"code": ["An Organization already exists with this code."]}
                )
        return super().validate_unique(exclude=exclude)

    def save(self, *args, **kwargs):
        """
        Enforce validation on each instance save
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def get_courses(self, language=None):
        """
        Return a query to get the courses related to this organization ie for which a plugin for
        this organization is linked to the course page on the "course_organizations" placeholder.
        """
        page = (
            self.extended_object
            if self.extended_object.publisher_is_draft
            else self.draft_extension.extended_object
        )
        language = language or translation.get_language()
        bfs = "extended_object__placeholders__cmsplugin__courses_organizationpluginmodel__page"
        filter_dict = {
            "extended_object__node__parent__cms_pages__course__isnull": True,
            "extended_object__publisher_is_draft": True,
            "extended_object__placeholders__slot": "course_organizations",
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: page,
            "{:s}__publisher_is_draft".format(bfs): True,
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


class OrganizationPluginModel(PagePluginMixin, CMSPlugin):
    """
    Organization plugin model handles the relation from OrganizationPlugin
    to their Organization instance
    """

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="organization_plugins",
        limit_choices_to={
            "publisher_is_draft": True,  # plugins work with draft instances
            "organization__isnull": False,  # limit to pages linked to a course object
        },
    )

    class Meta:
        db_table = "richie_organization_plugin"
        verbose_name = _("organization plugin")

    def __str__(self):
        """Human representation of a organization plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


extension_pool.register(Organization)
