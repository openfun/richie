"""
Declare and configure the models for the courses application
"""
from django.db import models
from django.db.models import BooleanField, Case, Value, When
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin
from filer.fields.image import FilerImageField

from ...core.models import BasePageExtension

GLIMPSE_CTA = [_("enroll now")] * 2 + [None] * 4
GLIMPSE_TEXT = [
    _("closing on"),
    _("starting on"),
    _("starting on"),
    _("on-going"),
    _("archived"),
    _("coming soon"),
]


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
        We must manually copy the many-to-many relations so that the relations between the
        published instances are realigned with draft instances.
        """
        # pylint: disable=no-member
        self.organizations.set(
            self.organizations.model.objects.filter(
                draft_extension__courses=oldinstance
            )
        )
        self.subjects.set(
            self.subjects.model.objects.filter(draft_extension__courses=oldinstance)
        )

    @property
    def draft_self(self):
        """
        The draft version of self ie either itself if it is draft, or the related draft if it
        is public.
        """
        try:
            return self.draft_extension
        except Course.DoesNotExist:
            return self

    @property
    def course_runs(self):
        """
        This property replaces the backward relation to course runs so that we always return
        the course runs related to the draft version of a course.
        """
        return self.draft_self.courserun_set

    @property
    def glimpse_info(self):
        """
        The date to display on a course glimpse. It is the "date of best interest" depending on
        the situation of a course.

        The game is to find, in the correct order, the first of the following conditions that is
        verified for this course:
          0: a run is on-going and open for enrollment > "closing on": {enrollment_end}
          1: a run is future and open for enrollment > "starting on": {start}
          2: a run is future and not yet or no more open for enrollment >
            "starting on": {start}
          3: a run is on-going but closed for enrollment > "on going": {None}
          4: there's a finished run in the past > "archived": {None}
          5: there are no runs at all > "coming soon": {None}
        """
        now = timezone.now()
        best_run = 5
        interesting_datetime = None

        for course_run in self.course_runs.annotate(
            is_future=Case(
                When(start__gt=now, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
            is_ongoing=Case(
                When(start__lt=now, end__gt=now, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
            is_open=Case(
                When(
                    enrollment_start__lt=now, enrollment_end__gt=now, then=Value(True)
                ),
                default=Value(False),
                output_field=BooleanField(),
            ),
        ).values("is_future", "is_ongoing", "is_open", "start", "enrollment_end"):
            if course_run["is_ongoing"] and course_run["is_open"]:
                best_run = 0
                interesting_datetime = course_run["enrollment_end"]
                break
            elif course_run["is_future"] and course_run["is_open"]:
                best_run = 1
                interesting_datetime = course_run["start"]
            elif course_run["is_future"]:
                best_run = min(2, best_run)
                interesting_datetime = course_run["start"]
            elif course_run["is_ongoing"]:
                best_run = min(3, best_run)
            else:
                best_run = min(4, best_run)

        return {
            "cta": GLIMPSE_CTA[best_run],
            "text": GLIMPSE_TEXT[best_run],
            "datetime": interesting_datetime,
        }

    def save(self, *args, **kwargs):
        """
        Enforce validation each time an instance is saved
        Make sure the main organization is also included in `organizations` as a m2m relation
        """
        self.full_clean()
        super().save(*args, **kwargs)

        if self.pk and self.extended_object.publisher_is_draft:
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

    @property
    def state(self):
        """Return the state of the course run at the current time."""
        now = timezone.now()
        if self.start < now:
            if self.end > now:
                if self.enrollment_end > now:
                    return "is_open"
                return "is_ongoing"
            return "is_archived"
        elif self.enrollment_start > now:
            return "is_coming"
        elif self.enrollment_end > now:
            return "is_open"
        return "is_closed"


class CoursePluginModel(CMSPlugin):
    """
    Course plugin model handles the relation from CoursePlugin
    to their Course instance
    """

    course = models.ForeignKey(
        "Course",
        related_name="course",
        limit_choices_to={"extended_object__publisher_is_draft": True},
    )

    class Meta:
        verbose_name = _("course plugin model")

    def __str__(self):
        """Human representation of a course plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )


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
