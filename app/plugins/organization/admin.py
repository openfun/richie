from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

from cms.admin.placeholderadmin import PlaceholderAdminMixin

from .models import Organization

class OrganizationAdmin(PlaceholderAdminMixin, admin.ModelAdmin):
    """
    Placeholder and Model Admin to customize administration page
    """

    list_display = ('name', 'short_name', 'code', 'slug',
        'is_detail_page_enabled', 'is_obsolete', 'partnership_level', 'score')

    list_editable = ('score', 'is_detail_page_enabled', 'is_obsolete')

    list_filter = ('is_detail_page_enabled', 'is_obsolete', 'partnership_level')

    search_fields = ('name', 'code', 'short_name', 'slug', 'description')

    prepopulated_fields = {'slug': ('name',)}

    fieldsets = (
        (None, {
            'fields': (
                ('name', 'short_name', 'code'),
                ('logo',),
                ('certificate_logo',),
                'partnership_level',
                'score',
            )
        }),
        (_('Displayed On Site | Banner | Description'), {
            'fields': (
                ('is_detail_page_enabled',),
                ('is_obsolete',),
                ('slug',),
                ('banner',),
                ('description',),
            )
        }),
    )

admin.site.register(Organization, OrganizationAdmin)
