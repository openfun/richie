from django.contrib import admin

from cms.extensions import PageExtensionAdmin

from .models import OrganizationPage


class OrganizationPageAdmin(PageExtensionAdmin):
    pass


admin.site.register(OrganizationPage, OrganizationPageAdmin)
