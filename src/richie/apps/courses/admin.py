"""
Courses application admin
"""
from django.contrib import admin
from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.extensions import PageExtensionAdmin

from .fields import CourseRunSplitDateTimeField
from .forms import LicenceFormAdmin
from .models import Course, CourseRun, Licence, Organization
from .widgets import CourseRunSplitDateTimeWidget


class CourseRunInline(admin.StackedInline):
    """
    Admin class for the CourseRun model.
    Inline to display course runs on the change form of a course.
    """

    model = CourseRun
    formfield_overrides = {
        models.DateTimeField: {
            "form_class": CourseRunSplitDateTimeField,
            "widget": CourseRunSplitDateTimeWidget,
        }
    }
    extra = 0
    verbose_name = _("course run")
    verbose_name_plural = _("course runs")


class CourseAdmin(PageExtensionAdmin):
    """Admin class for the Course model"""

    list_display = ["title"]
    inlines = [CourseRunInline]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Display the course title as a read-only field from the related page
        """
        return obj.extended_object.get_title()


class OrganizationAdmin(PageExtensionAdmin):
    """
    Admin class for the Organization model
    """

    list_display = ["title", "code"]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Get the page title from the related page
        """
        return obj.extended_object.get_title()


class LicenceAdmin(admin.ModelAdmin):
    """
    Admin class for the Licence model
    """

    list_display = ["name"]
    form = LicenceFormAdmin


admin.site.register(Course, CourseAdmin)
admin.site.register(Organization, OrganizationAdmin)
admin.site.register(Licence, LicenceAdmin)
