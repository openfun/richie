"""
Declare and configure the models related to Organizations
"""
import uuid

from django.db import models
from django.utils.text import slugify
from django.utils.translation import ugettext_lazy as _

from cms.extensions import PageExtension
from cms.extensions.extension_pool import extension_pool

ORGANIZATIONS_PAGE_REVERSE_ID = 'organizations'


class Organization(models.Model):
    """
    The Organization model is used to represent and record entities that manage courses.
    It could be a university or a training company for example.

    This model should be used to record structured data about the organization whereas the
    associated page object is where we record the less structured information to display on the
    page to present the organization.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_("name"), max_length=255)
    code = models.CharField(
        _("code"),
        db_index=True,
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )
    logo = models.ImageField(
        upload_to='organizations/logo/',
        verbose_name=_("organization logo"),
        help_text=_("Recommended size: 180x100"),
        blank=True,
    )

    class Meta:
        verbose_name = _("organization")

    def __str__(self):
        """Human representation of an organization"""
        return '{model}: {name} ({code})'.format(
            code=self.code,
            name=self.name,
            model=self._meta.verbose_name.title(),
        )

    # pylint: disable=arguments-differ
    def save(self, *args, **kwargs):
        """
        We normalize the code with slugify for better uniqueness
        """
        if self.code:
            self.code = slugify(self.code, allow_unicode=True).upper()
        return super().save(*args, **kwargs)

    def get_page(self):
        """Return the draft CMS page"""
        try:
            return self.organization_pages.\
                select_related('extended_object').\
                get(extended_object__publisher_is_draft=True).\
                extended_object
        except OrganizationPage.DoesNotExist:
            return None


class OrganizationPage(PageExtension):
    """Organization page extension"""

    organization = models.ForeignKey(Organization, related_name='organization_pages')

    class Meta:
        unique_together = ('extended_object', 'organization')
        verbose_name = _("organization page")

    def __str__(self):
        """Human representation of an organization page"""
        return '{model}: {name} ({code})'.format(
            code=self.organization.code,
            name=self.organization.name,
            model=self._meta.verbose_name.title(),
        )


extension_pool.register(OrganizationPage)
