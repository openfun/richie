"""
Courses application admin
"""

from itertools import chain
from operator import itemgetter

from django import forms
from django.conf import settings
from django.contrib import admin
from django.core.exceptions import PermissionDenied, ValidationError
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
from cms.utils import page_permissions
from parler.admin import TranslatableAdmin
from parler.forms import TranslatableModelForm

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


class CourseRunAdminForm(TranslatableModelForm):
    """Admin form used for frontend editing."""

    class Meta:
        model = models.CourseRun
        fields = [
            "direct_course",
            "title",
            "resource_link",
            "start",
            "end",
            "enrollment_start",
            "enrollment_end",
            "languages",
            "enrollment_count",
            "catalog_visibility",
            "price_currency",
            "offer",
            "price",
            "certificate_offer",
            "certificate_price",
            "sync_mode",
            "display_mode",
        ]

    def __init__(self, *args, **kwargs):
        """
        If the form is instanciated to update an existing course run:
            > show the direct course select box only if the course has one or more snapshots
              and limit choices to either the master course or one of its snapshots

        If the form is instanciated to create a new course run and the "Add" form is opened via
        the widget from the course detail page on the frontend, the "direct_course" field receives
        the "id" of the related course as initial value (e.g. happens when you pass it via the
        querystring in Django admin):
            > hide the direct course select box
        """
        super().__init__(*args, **kwargs)

        if "direct_course" not in self.fields:
            return

        if self.instance.pk:
            course_query = (
                self.instance.get_course()
                .get_snapshots(include_self=True)
                .filter(extended_object__publisher_is_draft=True)
                .distinct()
            )
        else:
            course_query = models.Course.objects.filter(
                extended_object__publisher_is_draft=True
            )

            # pylint: disable=no-member
            user = self.request.user
            if getattr(settings, "CMS_PERMISSION", False) and not user.is_superuser:
                course_query = models.Course.objects.filter(
                    django_models.Q(extended_object__pagepermission__user=user)
                    | django_models.Q(
                        extended_object__pagepermission__group__user=user
                    ),
                    extended_object__pagepermission__can_change=True,
                    extended_object__publisher_is_draft=True,
                )

            if kwargs.get("initial", {}).get("direct_course"):
                self.fields["direct_course"].widget = forms.HiddenInput()

        self.fields["direct_course"].choices = chain(
            [("", self.fields["direct_course"].empty_label)],
            [(c.pk, c.extended_object.get_title()) for c in course_query],
        )

        if len(course_query) < 2:
            self.fields["direct_course"].widget = forms.HiddenInput()

        self.fields["languages"].choices = sorted(
            self.fields["languages"].choices, key=itemgetter(1)
        )

    def clean_direct_course(self):
        """Ensure that the user has the required permissions to change the related course page."""
        course = self.cleaned_data["direct_course"]
        if (
            course
            and getattr(settings, "CMS_PERMISSION", False)
            and not page_permissions.user_can_change_page(
                self.request.user,  # pylint: disable=no-member
                course.extended_object,
                course.extended_object.node.site,
            )
        ):
            raise ValidationError(
                "You do not have permission to change this course page."
            )

        return course


class CourseRunAdmin(FrontendEditableAdminMixin, TranslatableAdmin):
    """Admin class for the CourseRun model"""

    frontend_editable_fields = (
        "direct_course",
        "title",
        "resource_link",
        "start",
        "end",
        "enrollment_start",
        "enrollment_end",
        "languages",
        "enrollment_count",
        "catalog_visibility",
        "price_currency",
        "offer",
        "price",
        "certificate_offer",
        "certificate_price",
        "sync_mode",
    )
    list_display = ["id"]
    form = CourseRunAdminForm
    formfield_overrides = {
        django_models.DateTimeField: {
            "form_class": CourseRunSplitDateTimeField,
            "widget": CourseRunSplitDateTimeWidget,
        }
    }

    def has_module_permission(self, request):
        """
        Hide course runs from the admin page as frontend editing provides a better experience.
        """
        return False

    def get_form(self, request, obj=None, **kwargs):
        """Add request to form so we can validate fields according to the user."""
        form = super().get_form(request, obj=obj, **kwargs)
        form.request = request
        return form

    def has_view_permission(self, request, obj=None):
        """Allow view only if the user is allowed to change the related course page."""
        if obj:
            course_page = obj.direct_course.extended_object
            if not course_page.publisher_is_draft:
                return False
            if getattr(
                settings, "CMS_PERMISSION", False
            ) and not page_permissions.user_can_change_page(
                request.user, course_page, course_page.node.site
            ):
                return False
        return super().has_view_permission(request, obj=obj)

    def has_change_permission(self, request, obj=None):
        """Allow change only if the user is allowed to change the related course page."""
        if obj:
            course_page = obj.direct_course.extended_object
            if not course_page.publisher_is_draft:
                return False
            if getattr(
                settings, "CMS_PERMISSION", False
            ) and not page_permissions.user_can_change_page(
                request.user, course_page, course_page.node.site
            ):
                return False
        return super().has_change_permission(request, obj=obj)

    def has_delete_permission(self, request, obj=None):
        """Allow change only if the user is allowed to change the related course page."""
        if obj and getattr(settings, "CMS_PERMISSION", False):
            course_page = obj.direct_course.extended_object
            if not page_permissions.user_can_change_page(
                request.user, course_page, course_page.node.site
            ):
                return False
        return super().has_delete_permission(request, obj=obj)

    # pylint: disable=no-member
    def save(self, commit=True):
        """
        Trigger check that will mark the related course page dirty if its content has changed
        since it was last saved.
        """
        super().save(commit=commit)
        if commit is True:
            self.instance.mark_course_dirty()
        return self.instance


class CourseAdmin(FrontendEditableAdminMixin, PageExtensionAdmin):
    """Admin class for the Course model"""

    list_display = ["title", "is_listed"]
    frontend_editable_fields = (
        "code",
        "duration",
        "effort",
        "is_listed",
        "is_self_paced",
    )

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


class MainMenuEntryAdmin(PageExtensionAdmin):
    """
    Admin class for the MainMenuEntry model
    """

    list_display = ["title", "allow_submenu"]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Get the page title from the related page
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
admin.site.register(models.MainMenuEntry, MainMenuEntryAdmin)
admin.site.register(models.Organization, OrganizationAdmin)
admin.site.register(models.PageRole, PageRoleAdmin)
admin.site.register(models.Person, PersonAdmin)
