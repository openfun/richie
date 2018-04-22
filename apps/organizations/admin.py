"""
Configure the Django admin page to manage Organizations
"""
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

from .models import Organization


class OrganizationAdmin(admin.ModelAdmin):
    """
    Admin class for the Organization model
    """
    list_display = ['name', 'code', 'view_in_cms']

    # pylint: disable=no-self-use
    def view_in_cms(self, organization):
        """
        Add a link in the admin list view to go to the page of the organization in the CMS
        """
        # If the organization is linked to a page on the CMS, we want to display a link that
        # opens a new tab and displays this page.
        page = organization.get_page()
        if page:
            return '<a href="{url:s}" target="_blank">{anchor!s}</a>'.format(
                anchor=_("View"),
                url=page.get_absolute_url(),
            )
        # If there is no page, we display "(no page)" as often seen in Django
        return '({t!s})'.format(t=_("no page"))
    view_in_cms.allow_tags = True
    view_in_cms.short_description = _("View organization in the CMS")


admin.site.register(Organization, OrganizationAdmin)
