from django.contrib import admin

from cms.admin.placeholderadmin import PlaceholderAdminMixin

from django.utils.translation import ugettext_lazy as _

from .models import University

class UniversityAdmin(PlaceholderAdminMixin, admin.ModelAdmin):
    """
    Placeholder and Model Admin to customize administration page
    """

    list_display = ('name', 'short_name', 'code', 'slug',
        'detail_page_enabled', 'is_obsolete', 'partnership_level', 'score')

    list_editable = ('score', 'detail_page_enabled', 'is_obsolete')

    list_filter = ('detail_page_enabled', 'is_obsolete', 'partnership_level')

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
        (_('Advanced'), {
            'fields': (
                'prevent_auto_update',
            )
        }),
        (_('Displayed On Site | Banner | Description'), {
            'fields': (
                ('detail_page_enabled',),
                ('is_obsolete',),
                ('slug',),
                ('banner',),
                ('description',),
            )
        }),
    )

admin.site.register(University, UniversityAdmin)
