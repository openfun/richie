""" FUN Course models"""

import uuid

from django.db import models
from django.utils.translation import ugettext_lazy as _

from parler.models import TranslatableModel, TranslatedFields

from cms.extensions import PageExtension
from cms.extensions.extension_pool import extension_pool

COURSES_PAGE_REVERSE_ID = "courses"
COURSE_SUBJECTS_PAGE_REVERSE_ID = "subjects"


class Course(models.Model):
    """
    A course running on the platform and relations to orgnization which created it
    and its content thematics
    `active_session` field is the edX course_key of the current session.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    active_session = models.CharField(
        max_length=200,
        verbose_name=_("Course key of active course session"),
        unique=True,
        null=True,
        db_index=True,
    )
    name = models.CharField(_("Title"), max_length=255)

    organizations = models.ManyToManyField(
        "organizations.Organization",
        through="CourseOrganizationRelation",
        related_name="courses",
    )

    subjects = models.ManyToManyField("CourseSubject", related_name="courses")

    class Meta:
        verbose_name = _("course")

    def __str__(self):
        """Human representation of a course."""
        session = self.active_session if self.active_session else "No active session"
        return "{model}: {title} - {session}".format(
            title=self.title, session=session, model=self._meta.verbose_name.title()
        )

    def get_page(self):
        """Returns draft CMS page if any."""
        try:
            return self.course_pages.select_related("extended_object").get(
                extended_object__publisher_is_draft=True
            ).extended_object
        except CoursePage.DoesNotExist:
            return None


class CoursePage(PageExtension):
    """Course page extension"""

    course = models.ForeignKey(Course, related_name="course_pages")

    def __str__(self):
        """Human representation of a course page extension"""
        return "{model}: {title} - {key}".format(
            title=self.course.title,
            key=self.course.active_session,
            model=self._meta.verbose_name.title(),
        )


extension_pool.register(CoursePage)


class CourseSubject(TranslatableModel):
    """A Course thematic."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    translations = TranslatedFields(
        name=models.CharField(_("name"), max_length=255),
        short_name=models.CharField(
            _("short name"),
            max_length=255,
            null=True,
            blank=True,
            help_text=_("Displayed where space is rare - on side panel for instance."),
        ),
    )

    def get_page(self):
        """Return the draft CMS page"""
        try:
            return self.course_subject_pages.select_related("extended_object").get(
                extended_object__publisher_is_draft=True
            ).extended_object
        except CourseSubjectPage.DoesNotExist:
            return None

    class Meta:
        verbose_name = _("course subject")

    def __str__(self):
        """Human representation of a course subject"""
        return "{model}: {subject}".format(
            subject=self.name, model=self._meta.verbose_name.title()
        )


class CourseSubjectPage(PageExtension):
    """Course subject page extension"""

    course_subject = models.ForeignKey(
        CourseSubject, related_name="course_subject_pages"
    )

    class Meta:
        verbose_name = _("course subject page")

    def __str__(self):
        """Human representation of a course subject page extension"""
        return "{model}: {subject} - {key}".format(
            subject=self.course_subject.name,
            key=self.course.active_session,
            model=self._meta.verbose_name.title(),
        )


extension_pool.register(CourseSubjectPage)


class CourseOrganizationRelation(models.Model):
    """
    'Course to Organization' relation.
    As courses can be made by multiple organizations at several levels of
    implication, this relation is weighted by a rank value.
    """
    organization = models.ForeignKey(
        "organizations.Organization", related_name="related_courses"
    )
    course = models.ForeignKey("Course", related_name="related_organizations")
    rank = models.PositiveIntegerField(_("Rank"), default=0, db_index=True)

    class Meta:
        verbose_name = _("course-organization relation")
        unique_together = (("course", "organization"), ("course", "rank"))
        ordering = ("course", "rank")

    def __str__(self):
        """Human representation of a Course to organization relation."""
        return "{model}: {name}: {organization}-{course}".format(
            name=self._meta.verbose_name.title(),
            organization=self.organization.name,
            course=self.course.title,
            model=self._meta.verbose_name.title(),
        )
