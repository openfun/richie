"""
Courses application admin
"""
from django.contrib import admin
from django.db import models

from cms.admin.placeholderadmin import FrontendEditableAdminMixin
from cms.extensions import PageExtensionAdmin

from .fields import CourseRunSplitDateTimeField
from .forms import LicenceFormAdmin
from .models import Course, CourseRun, Licence, Organization
from .widgets import CourseRunSplitDateTimeWidget


class CourseAdmin(PageExtensionAdmin):
    """Admin class for the Course model"""

    list_display = ["title"]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Display the course title as a read-only field from the related page
        """
        return obj.extended_object.get_title()


class CourseRunAdmin(FrontendEditableAdminMixin, PageExtensionAdmin):
    """Admin class for the CourseRun model"""

    list_display = ["title"]
    frontend_editable_fields = (
        "resource_link",
        "start",
        "end",
        "enrollment_start",
        "enrollment_end",
    )
    formfield_overrides = {
        models.DateTimeField: {
            "form_class": CourseRunSplitDateTimeField,
            "widget": CourseRunSplitDateTimeWidget,
        }
    }

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
admin.site.register(CourseRun, CourseRunAdmin)
admin.site.register(Organization, OrganizationAdmin)
admin.site.register(Licence, LicenceAdmin)
