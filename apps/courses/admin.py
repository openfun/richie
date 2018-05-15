"""
Courses application admin
"""
from django.contrib import admin

from cms.extensions import PageExtensionAdmin

from .models import Course


class CourseAdmin(PageExtensionAdmin):
    """Admin class for the Course model"""
    list_display = ["title", "main_organization", "active_session"]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Display the course title as a read-only field from the related page
        """
        return obj.extended_object.get_title()

    def save_related(self, request, form, formsets, change):
        """
        When a model is saved via the admin, the main object gets saved first (to make sure it has
        a pk), then the many-to-many are cleared and the new values set to whatever came out of
        the form (see http://stackoverflow.com/a/1925784/469575).

        This means that we can not rely on our override of the `save` method on the model to modify
        the `organizations` many-to-many field and make sure it includes the main organization.
        """
        super().save_related(request, form, formsets, change)
        form.instance.organizations.add(form.instance.main_organization)


admin.site.register(Course, CourseAdmin)
