"""
Settings specific to the courses application
"""
from django.conf import settings

PAGE_EXTENSION_TOOLBAR_ITEM_POSITION = getattr(
    settings, "RICHIE_PAGE_EXTENSION_TOOLBAR_ITEM_POSITION", 4
)
