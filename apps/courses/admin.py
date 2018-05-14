"""
Courses application admin
"""
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _, pgettext

from parler.admin import TranslatableAdmin

from .models import Course, CourseSubject


class ViewInCMSMixin():
    """
        This mixin will add a link in the admin list view to go to the page of the
        object in the CMS. It can be applied to ModelAdmin class of objects using
        the PageExtension pattern and implementing the `get_page` method.
    """
    # pylint: disable=no-self-use
    def view_in_cms(self, obj):
        """
        If the object is linked to a page on the CMS, we want to display a link that
        opens a new tab and displays this page.
        """
        page = obj.get_page()
        if page:
            return '<a href="{url:s}" target="_blank">{anchor!s}</a>'.format(
                anchor=pgettext("verb", "View"), url=page.get_absolute_url()
            )
        # If there is no page, we display "(no page)" as often seen in Django
        return "({t!s})".format(t=_("no page"))

    view_in_cms.allow_tags = True
    view_in_cms.short_description = _("CMS page")


class CourseAdmin(admin.ModelAdmin, ViewInCMSMixin):
    """Admin class for Course model"""
    list_display = ["active_session", "name", "view_in_cms"]


class CourseSubjectAdmin(TranslatableAdmin, ViewInCMSMixin):
    """Admin class for CourseSubject model"""
    list_display = ["name", "short_name", "view_in_cms"]


admin.site.register(Course, CourseAdmin)
admin.site.register(CourseSubject, CourseSubjectAdmin)
