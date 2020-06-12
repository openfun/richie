"""
Django admin site configuration for the enrollments app.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    """
    Admin setup for enrollments.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at", "user"]

    # Help users navigate topics more easily in the list view
    list_display = ("id", "user_name", "course_run_name")

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("course_run",)

    # pylint: disable=no-self-use
    def course_run_name(self, enrollment):
        """
        Return the linked course run's name to display it on the enrollments list view.
        """
        return (
            enrollment.course_run.get_course().get_page().get_title(),
            enrollment.course_run.get_page().get_title(),
        )

    course_run_name.short_description = _("course run")

    # pylint: disable=no-self-use
    def user_name(self, enrollment):
        """
        Return the linked user's name to display it on the enrollments list view.
        """
        return enrollment.user.get_full_name()

    user_name.short_description = _("user name")
