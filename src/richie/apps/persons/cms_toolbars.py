"""
Toolbar extension for the courses application
"""
from cms.toolbar_pool import toolbar_pool

from .models import Person
from ..courses.cms_toolbars import BaseExtensionToolbar


@toolbar_pool.register
class PersonExtensionToolbar(BaseExtensionToolbar):
    """
    This extension class customizes the toolbar for the person page extension
    """

    model = Person
