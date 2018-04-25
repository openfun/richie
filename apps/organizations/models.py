"""
Organizations application models
"""

from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.extensions import PageExtension
from cms.extensions.extension_pool import extension_pool


ORGANIZATIONS_PAGE_REVERSE = 'organizations'


class Organization(models.Model):
    """Organization model"""

    code = models.CharField(_("Organization code"), max_length=100, unique=True, db_index=True)
    name = models.CharField(_("Organization name"), max_length=200)
    logo = models.ImageField(
        upload_to='organizations/logo/',
        verbose_name=u"Organization logo",
        help_text="Recommended size: 180x100",
        blank=True)

    def __str__(self):
        """Human representation of an organization"""
        page = self.get_page()
        return "Organization: {code} - {page}".format(
            code=self.code, page=page.get_title() if page else "Not linked to a page")

    class Meta:
        verbose_name = _('Organization')

    def get_page(self):
        """Return draft CMS page."""
        if self.has_page:
            return self.organizationpage.get(extended_object__publisher_is_draft=True).get_page()
        return None

    @property
    def has_page(self):
        """Do this Organization has a CMS page ?"""
        return self.organizationpage.count() > 0


class OrganizationPage(PageExtension):
    """Organization page extension"""

    organization = models.ForeignKey(Organization, related_name='organizationpage')

    def __str__(self):
        """Human representation of an organization page"""
        return "Organization page: {code}".format(code=self.organization.code)

    class Meta:
        verbose_name = _('Organization page')

    def get_page(self):
        return self.extended_object

    def get_absolute_url(self):
        """Get organization page absolute URL"""
        return self.extended_object.get_absolute_url()


extension_pool.register(OrganizationPage)
