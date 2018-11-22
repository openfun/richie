"""
Courses application admin
"""
import time

from django.conf.urls import url
from django.contrib import admin
from django.db import models, transaction
from django.http import HttpResponseBadRequest, HttpResponseForbidden, JsonResponse
from django.utils.decorators import method_decorator
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.http import require_POST

from cms.admin.placeholderadmin import FrontendEditableAdminMixin
from cms.api import Page, create_title
from cms.extensions import PageExtensionAdmin
from cms.utils import page_permissions
from cms.utils.admin import jsonify_request

from .fields import CourseRunSplitDateTimeField
from .forms import LicenceFormAdmin
from .models import Course, CourseRun, Licence, Organization
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
                HttpResponseBadRequest(
                    force_text(_("Error! Course could not be found."))
                )
            )

        # If the page has a parent that is a course page, it is a snapshot and should therefore
        # not be allowed to be itself snapshotted.
        if page.parent_page:
            try:
                page.parent_page.course
            except Course.DoesNotExist:
                pass
            else:
                return jsonify_request(
                    HttpResponseForbidden(
                        force_text(_("Error! You can't snapshot a snapshot."))
                    )
                )

        site = page.node.site

        # User can only snapshot pages he can see
        can_snapshot = page_permissions.user_can_change_page(request.user, page, site)

        if can_snapshot:
            # User can only snapshot a page if he has the permission to add a page under it.
            can_snapshot = page_permissions.user_can_add_subpage(
                request.user, page, site
            )

        if not can_snapshot:
            return jsonify_request(
                HttpResponseForbidden(
                    force_text(
                        _("Error! You don't have permissions to snapshot this page.")
                    )
                )
            )

        # Copy the page as its own child with its extension.
        # Titles are set to a timestamp in each language of the original page
        new_page = page.copy(
            site, parent_node=page.node, translations=False, extensions=True
        )

        # The snapshot title and slug is set to a timestamp of the time of snapshot. It is
        # published only in languages for which the original course page was published.
        for language in page.get_languages():
            base = page.get_path(language)
            timestamp = str(int(time.time()))
            snapshot_title = _("Snapshot of {:s}").format(page.get_title(language))
            create_title(
                language=language,
                menu_title=timestamp,
                title="{:s} - {:s}".format(timestamp, snapshot_title),
                slug=timestamp,
                path="{:s}/{:s}".format(base, timestamp) if base else timestamp,
                page=new_page,
            )
            if page.is_published(language) is True:
                new_page.publish(language)

        # Move the existing course run subpages as children of the snapshot
        # Their publication status will be respected
        for subpage in page.get_child_pages().filter(courserun__isnull=False):
            subpage.move_page(new_page.node, position="last-child")

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
