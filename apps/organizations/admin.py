"""
Organizations application admin
"""
from django.contrib import admin
from django.forms import ModelForm
from django.utils.translation import ugettext_lazy as _, pgettext

from cms.extensions import PageExtensionAdmin

from .models import Organization, OrganizationPage


def cms_button(obj):
    """CMS page button"""
    page = obj.get_page()
    if page:
        url = obj.get_page().get_absolute_url()
        return "<a href='{url}'>{button}</a>".format(
            button=pgettext('verb', "View"), url=url)
    return '-'


cms_button.allow_tags = True
cms_button.short_description = _("CMS page")


class OrganizationAdmin(admin.ModelAdmin):
    """Admin class for Organization model"""
    list_display = ['code', 'name', cms_button]


class OrganizationPageForm(ModelForm):
    """ OrganizationPage form admin
    """
    model = OrganizationPage
    fields = ['logo', 'banner']


class OrganizationPageAdmin(PageExtensionAdmin):
    """OrganizationPage admin"""
    form = OrganizationPageForm


admin.site.register(OrganizationPage, OrganizationPageAdmin)
admin.site.register(Organization, OrganizationAdmin)
