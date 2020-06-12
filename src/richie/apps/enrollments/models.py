"""
Declare and configure `enrollment` application models.
"""
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from richie.apps.courses.models import CourseRun


class Enrollment(models.Model):
    """
    Enrollment model. Links a user to the course runs they have enrolled in.

    In most cases, actual enrollment also needs to happen in the actual LMS behind Richie.
    Still, we need a simple and fast way to look up and manage user enrollments in
    Richie itself, which is tough to achieve if every action necessitates a bunch of
    API calls to different LMSes.

    This is where the Enrollment model comes in: it is kept in sync with enrollments in various
    LMSes but provides a unified Django way to know about them and manage them.
    """

    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    user = models.ForeignKey(
        verbose_name=_("user"),
        help_text=_("user whose enrollment is represented"),
        to=get_user_model(),
        on_delete=models.CASCADE,
        related_name="enrollments",
        related_query_name="enrollment",
    )
    course_run = models.ForeignKey(
        verbose_name=_("course run"),
        help_text=_("course run the user enrolled in"),
        to=CourseRun,
        on_delete=models.CASCADE,
        related_name="enrolled_users",
        related_query_name="enrolled_user",
    )

    class Meta:
        db_table = "richie_enrollment"
        unique_together = [("user", "course_run")]
        verbose_name = _("enrollment")

    def __str__(self):
        """Human representation of an enrollment."""
        return f"{self._meta.verbose_name.title()}: {self.id}"
