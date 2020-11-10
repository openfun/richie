"""
Courses application admin
"""
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.db import models as django_models
from django.db import transaction
from django.http import HttpResponseBadRequest, HttpResponseForbidden, JsonResponse
from django.urls import re_path
from django.utils.decorators import method_decorator
from django.utils.encoding import force_str
from django.utils.translation import gettext_lazy as _
from django.views.decorators.http import require_POST

from cms.admin.placeholderadmin import FrontendEditableAdminMixin
from cms.api import Page
from cms.extensions import PageExtensionAdmin
from parler.admin import TranslatableAdmin

from ..core.admin import link_field
from . import models
from .fields import CourseRunSplitDateTimeField
from .forms import AdminCategoryForm, AdminLicenceForm
from .helpers import snapshot_course
from .widgets import CourseRunSplitDateTimeWidget

REQUIRE_POST = method_decorator(require_POST)


class CategoryAdmin(FrontendEditableAdminMixin, PageExtensionAdmin):
    """Admin class for the Category model"""

    form = AdminCategoryForm


class CourseAdmin(FrontendEditableAdminMixin, PageExtensionAdmin):
    """Admin class for the Course model"""

    list_display = ["title", "is_listed"]
    frontend_editable_fields = ("effort", "duration", "is_listed")

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Display the course title as a read-only field from the related page
        """
        return obj.extended_object.get_title()

    def get_urls(self):
        """
        Add admin URL to trigger the snapshot of a course.
        """
        url_patterns = super().get_urls()
        return [
            re_path(
                r"^(?P<course_id>[0-9]+)/snapshot/$",
                self.admin_site.admin_view(self.snapshot),
                name="cms_course_snapshot",
            )
        ] + url_patterns

    # pylint: disable=unused-argument
    @REQUIRE_POST
    @transaction.atomic
    def snapshot(self, request, course_id, *args, **kwargs):
        """
        Snapshotting a course is making a copy of the course page with all its permissions and
        extensions, and placing the copy as the first child of the page being snapshotted, then
        moving all the course run of the page being snapshotted as children of the new snapshot
        so we keep record of the course as it was when these course runs were played.
        """
        try:
            page = Page.objects.select_related("node__site").get(
                publisher_is_draft=True, course__id=course_id
            )
        except Page.DoesNotExist:
            return HttpResponseBadRequest(force_str(_("Course could not be found.")))

        try:
            new_page = snapshot_course(page, request.user, simulate_only=False)
        except PermissionDenied as context:
            return HttpResponseForbidden(force_str(context))

        return JsonResponse({"id": new_page.course.id})


class CourseRunAdmin(FrontendEditableAdminMixin, PageExtensionAdmin):
    """Admin class for the CourseRun model"""

    list_display = ["title"]
    frontend_editable_fields = (
        "languages",
        "resource_link",
        "start",
        "end",
        "enrollment_start",
        "enrollment_end",
    )
    formfield_overrides = {
        django_models.DateTimeField: {
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


class PageRoleAdmin(admin.ModelAdmin):
    """
    Admin class for the PageRole model.
    """

    fields = [
        "role",
        link_field("page"),
        link_field("group", anchor=_("See user group")),
        link_field("folder", anchor=_("See filer folder")),
    ]
    list_display = ["id", "role", "page"]
    list_filter = ["role"]
    search_fields = ("id", "page__title_set__title")

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not obj:
            fieldsets[0][1]["fields"] = ["role", "page"]
        return fieldsets

    def get_readonly_fields(self, request, obj=None):
        """Don't allow modifying the object once created."""
        if obj:
            return self.fields
        return []


class PersonAdmin(PageExtensionAdmin):
    """Admin class for the Person model"""

    list_display = ["title"]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Display the person page title as a read-only field from the related page
        """
        return obj.extended_object.get_title()


class LicenceAdmin(TranslatableAdmin):
    """
    Admin class for the Licence model
    """

    list_display = ["name"]
    form = AdminLicenceForm


admin.site.register(models.Category, CategoryAdmin)
admin.site.register(models.Course, CourseAdmin)
admin.site.register(models.CourseRun, CourseRunAdmin)
admin.site.register(models.Licence, LicenceAdmin)
admin.site.register(models.Organization, OrganizationAdmin)
admin.site.register(models.PageRole, PageRoleAdmin)
admin.site.register(models.Person, PersonAdmin)
