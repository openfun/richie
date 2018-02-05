import requests

from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.extensions import PageExtension
from cms.extensions.extension_pool import extension_pool

FUN_ORGANIZATION_API = "https://www.fun-mooc.fr/fun/api/universities/"


def get_organization_data(organization_key):
    """Retrieve organization data from API"""
    url = '{endpoint}{id}'.format(endpoint=FUN_ORGANIZATION_API, id=organization_key)
    return requests.get(url).json()


def get_organizations(pagination=None):
    """Retrieve organizations list"""
    url = '{endpoint}?rpp={pagination}'.format(endpoint=FUN_ORGANIZATION_API,
                                               pagination=pagination or 1000)
    return requests.get(url).json()['results']


class OrganizationPage(PageExtension):

    organization_key = models.IntegerField(
        _('Organization key'),
        blank=False,
        default=1,
        null=False,
    )

    def get_data(self):
        return get_organization_data(self.organization_key)

    def get_absolute_url(self):
        return self.extended_object.get_absolute_url()

    def __repr__(self):
        return "Organization page: {key}".format(key=self.organization_key)


extension_pool.register(OrganizationPage)
