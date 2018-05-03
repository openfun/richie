"""
Declare and configure the models related to Organizations
"""
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify
from django.utils.translation import ugettext_lazy as _

from cms.extensions import PageExtension
from cms.extensions.extension_pool import extension_pool

ORGANIZATIONS_PAGE_REVERSE_ID = "organizations"


class Organization(PageExtension):
    """
    The organization page extension represents and records entities that manage courses.
    It could be a university or a training company for example.

    This model should be used to record structured data about the organization whereas the
    associated page object is where we record the less structured information to display on the
    page to present the organization.
    """

    code = models.CharField(
        _("code"), db_index=True, max_length=100, null=True, blank=True
    )
    logo = models.ImageField(
        upload_to="organizations/logo/",
        verbose_name=_("organization logo"),
        help_text=_("Recommended size: 180x100"),
        blank=True,
    )

    class Meta:
        verbose_name = _("organization")

    def __str__(self):
        """Human representation of an organization"""
        return "{model}: {name} ({code})".format(
            code=self.code,
            name=self.extended_object.get_title(),
            model=self._meta.verbose_name.title(),
        )

    def clean(self):
        """
        We normalize the code with slugify for better uniqueness
        """
        if self.code:
            # Normalize the code by slugifying and capitalizing it
            self.code = slugify(self.code, allow_unicode=True).upper()
        return super().clean()

    def validate_unique(self, exclude=None):
        """
        We can't rely on a database constraint for uniqueness because pages
        exist in two versions: draft and published.
        """
        if self.code:
            # Check unicity for the version being saved (draft or published)
            is_draft = self.extended_object.publisher_is_draft
            uniqueness_query = self.__class__.objects.filter(
                code=self.code, extended_object__publisher_is_draft=is_draft
            )

            # If the page is being updated, we should exclude it while looking for duplicates
            if self.pk:
                uniqueness_query = uniqueness_query.exclude(pk=self.pk)

            # Raise a ValidationError if the code already exists
            if uniqueness_query.exists():
                raise ValidationError(
                    {"code": ["An Organization already exists with this code."]}
                )
        return super().validate_unique(exclude=exclude)

    def save(self, *args, **kwargs):
        """
        Enforce validation on each instance save
        """
        self.full_clean()
        super().save(*args, **kwargs)


extension_pool.register(Organization)
