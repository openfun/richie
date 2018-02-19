"""
Organizations application admin
"""

from cms.extensions import PageExtensionAdmin
from django.contrib import admin


from .models import OrganizationPage


class OrganizationPageAdmin(PageExtensionAdmin):
    """OrganizationPage admin"""
    pass


admin.site.register(OrganizationPage, OrganizationPageAdmin)
