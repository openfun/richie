"""
Configure the Django admin page to manage Organizations
"""
from django.contrib import admin

from cms.extensions import PageExtensionAdmin

from .models import Organization


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


admin.site.register(Organization, OrganizationAdmin)
