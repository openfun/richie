"""
Persons application admin
"""

from django.contrib import admin

from cms.extensions import PageExtensionAdmin
from parler.admin import TranslatableAdmin

from .models import Person, PersonTitle


class PersonAdmin(PageExtensionAdmin):
    """Admin class for the Person model"""

    list_display = ["title", "person_title", "first_name", "last_name"]

    # pylint: disable=no-self-use
    def title(self, obj):
        """
        Display the person page title as a read-only field from the related page
        """
        return obj.extended_object.get_title()


class PersonTitleAdmin(TranslatableAdmin):
    """Admin class for the PersonTitle model"""

    list_display = ["title", "abbreviation"]


admin.site.register(Person, PersonAdmin)
admin.site.register(PersonTitle, PersonTitleAdmin)
