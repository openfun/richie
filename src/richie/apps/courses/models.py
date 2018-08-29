"""
Declare and configure the models for the courses application
"""
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify
from django.utils.translation import ugettext_lazy as _

from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField

from ..core.models import BasePageExtension


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
        verbose_name = _("organization")

    def __str__(self):
        """Human representation of an organization"""
        return "{model}: {name} ({code})".format(
            code=self.code,
            name=self.extended_object.get_title(),
            model=self._meta.verbose_name.title(),
        )

    def copy_relations(self, oldinstance, language):
        """
        We must manually copy the many-to-many relations from the "draft" instance of
        to the "published" instance.
        """
        self.courses.set(oldinstance.courses.drafts())

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
                # pylint: disable=no-member
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


class Course(BasePageExtension):
    """
    The course page extension represents and records a course in the catalog.

    This model should be used to record structured data about the course whereas the
    associated page object is where we record the less structured information to display on the
    page that presents the course.
    """

    organization_main = models.ForeignKey(
        "Organization",
        related_name="main_courses",
        limit_choices_to={"extended_object__publisher_is_draft": True},
    )
    organizations = models.ManyToManyField(
        "Organization",
        related_name="courses",
        limit_choices_to={"extended_object__publisher_is_draft": True},
    )
    subjects = models.ManyToManyField(
        "Subject",
        related_name="courses",
        blank=True,
        limit_choices_to={"extended_object__publisher_is_draft": True},
    )

    ROOT_REVERSE_ID = "courses"
    TEMPLATE_DETAIL = "courses/cms/course_detail.html"

    class Meta:
        verbose_name = _("course")

    def __str__(self):
        """Human representation of a course."""
        return "{model}: {title}".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
        )

    def copy_relations(self, oldinstance, language):
        """
        We must manually copy the many-to-many relations from the "draft" instance
        to the "published" instance.
        """
        # pylint: disable=no-member
        self.organizations.set(oldinstance.organizations.drafts())
        self.subjects.set(oldinstance.subjects.drafts())

    @property
    def course_runs(self):
        """
        This property replaces the backward relation to course runs so that we always return
        the course runs related to the draft version of a course.
        """
        try:
            return self.draft_extension.courserun_set.all()
        except Course.DoesNotExist:
            return self.courserun_set.all()

    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved
        Make sure the main organization is also included in `organizations` as a m2m relation
        """
        self.full_clean()
        super().save(*args, **kwargs)

        if self.pk:
            # pylint: disable=no-member
            self.organizations.add(self.organization_main)


class CourseRun(models.Model):
    """
    The course run represents and records the occurence of a course between a start
    and an end date.
    """

    course = models.ForeignKey(
        Course,
        verbose_name=_("course"),
        related_name=None,
        limit_choices_to={"extended_object__publisher_is_draft": True},
        on_delete=models.CASCADE,
    )
    resource_link = models.URLField(_("Resource link"), blank=True, null=True)
    start = models.DateTimeField(_("course start"), blank=True, null=True)
    end = models.DateTimeField(_("course end"), blank=True, null=True)
    enrollment_start = models.DateTimeField(
        _("enrollment start"), blank=True, null=True
    )
    enrollment_end = models.DateTimeField(_("enrollment end"), blank=True, null=True)

    class Meta:
        verbose_name = _("course run")

    def __str__(self):
        """Human representation of a course run."""
        start = "{:%y/%m/%d %H:%M} - ".format(self.start) if self.start else ""
        return "{start:s}{course:s}".format(
            course=self.course.extended_object.get_title(), start=start
        )

    # pylint: disable=arguments-differ
    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved.
        """
        self.full_clean()
        super().save(*args, **kwargs)


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

    def copy_relations(self, oldinstance, language):
        """
        We must manually copy the many-to-many relations from the "draft" instance
        to the "published" instance.
        """
        self.courses.set(oldinstance.courses.drafts())


class Licence(models.Model):
    """
    Licence model.

    Instances of this models should only be created by administrators.
    """

    name = models.CharField(_("name"), max_length=200)
    logo = FilerImageField(verbose_name=_("logo"), related_name="licence")
    url = models.CharField(_("url"), blank=True, max_length=255)
    content = models.TextField(_("content"), blank=False, default="")

    class Meta:
        verbose_name = _("licence")

    def __str__(self):
        """Human representation of a person title"""
        return "{model}: {name}".format(
            model=self._meta.verbose_name.title(), name=self.name
        )


class OrganizationPluginModel(CMSPlugin):
    """
    Organization plugin model handles the relation from OrganizationPlugin
    to their Organization instance
    """

    organization = models.ForeignKey(Organization)

    class Meta:
        verbose_name = _("organization plugin model")

    def __str__(self):
        """Human representation of a organization plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


class LicencePluginModel(CMSPlugin):
    """
    Licence plugin model.
    """

    licence = models.ForeignKey(Licence)
    description = models.TextField(_("description"), blank=True, default="")

    def __str__(self):
        """Human representation of a person plugin"""
        return "{model:s}: {name:s}".format(
            model=self._meta.verbose_name.title(), name=self.licence.name
        )


extension_pool.register(Course)
extension_pool.register(Organization)
extension_pool.register(Subject)
