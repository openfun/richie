"""
Courses application admin
"""
from django.conf.urls import url
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.db import models, transaction
from django.http import HttpResponseBadRequest, HttpResponseForbidden, JsonResponse
from django.utils.decorators import method_decorator
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.http import require_POST

from cms.admin.placeholderadmin import FrontendEditableAdminMixin
from cms.api import Page
from cms.extensions import PageExtensionAdmin
from cms.utils.admin import jsonify_request
from parler.admin import TranslatableAdmin

from .fields import CourseRunSplitDateTimeField
from .forms import LicenceFormAdmin
from .helpers import snapshot_course
from .models import Course, CourseRun, Licence, Organization, Person, PersonTitle
from .widgets import CourseRunSplitDateTimeWidget

REQUIRE_POST = method_decorator(require_POST)


class CourseAdmin(PageExtensionAdmin):
    """Admin class for the Course model"""

    list_display = ["title"]

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
            url(
                r"^(?P<course_id>[0-9]+)/snapshot/$",
                self.admin_site.admin_view(self.snapshot),
                name="cms_course_snapshot",
            )
        ] + url_patterns

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
            return jsonify_request(
                HttpResponseBadRequest(force_text(_("Course could not be found.")))
            )

        try:
            new_page = snapshot_course(page, request.user, simulate_only=False)
        except PermissionDenied as context:
            return jsonify_request(HttpResponseForbidden(force_text(context)))

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


class PersonAdmin(PageExtensionAdmin):
    """Admin class for the Person model"""

    list_display = ["title", "person_title", "first_name", "last_name"]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Display the person page title as a read-only field from the related page
        """
        return obj.extended_object.get_title()


class PersonTitleAdmin(TranslatableAdmin):
    """Admin class for the PersonTitle model"""

    list_display = ["title", "abbreviation"]


class LicenceAdmin(admin.ModelAdmin):
    """
    Admin class for the Licence model
    """

    list_display = ["name"]
    form = LicenceFormAdmin


admin.site.register(Course, CourseAdmin)
admin.site.register(CourseRun, CourseRunAdmin)
admin.site.register(Licence, LicenceAdmin)
admin.site.register(Organization, OrganizationAdmin)
admin.site.register(Person, PersonAdmin)
admin.site.register(PersonTitle, PersonTitleAdmin)
