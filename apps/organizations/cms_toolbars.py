"""
Toolbar extension for organizations
"""
from cms.toolbar_pool import toolbar_pool

from apps.courses.cms_toolbars import BaseExtensionToolbar

from .models import Organization


@toolbar_pool.register
class OrganizationToolbar(BaseExtensionToolbar):
    """
    This extension class customizes the toolbar for the organization page extension
    """

    model = Organization
