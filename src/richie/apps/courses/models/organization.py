"""
Declare and configure the models for the courses application
"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from cms.api import Page, PagePermission
from cms.extensions.extension_pool import extension_pool
from cms.models import CMSPlugin
from filer.models import FolderPermission

from ...core.helpers import get_permissions
from ...core.models import BasePageExtension, EsIdMixin
from .. import defaults, utils
from .role import PageRole


class Organization(EsIdMixin, BasePageExtension):
    """
    The organization page extension represents and records entities that manage courses.
    It could be a university or a training company for example.

    This model should be used to record structured data about the organization whereas the
    associated page object is where we record the less structured information to display on the
    page to present the organization.
    """

    CODE_MAX_LENGTH = 100

    code = models.CharField(
        _("code"), db_index=True, max_length=CODE_MAX_LENGTH, null=True, blank=True
    )

    PAGE = defaults.ORGANIZATIONS_PAGE

    class Meta:
        db_table = "richie_organization"
        verbose_name = _("organization")
        verbose_name_plural = _("organizations")
        ordering = ["-pk"]

    def __str__(self):
        """Human representation of an organization"""
        model = self._meta.verbose_name.title()
        name = self.extended_object.get_title()
        code = f" ({self.code:s})" if self.code else ""
        return f"{model:s}: {name:s}{code:s}"

    def clean(self):
        """
        We normalize the code with slugify for better uniqueness
        """
        self.code = utils.normalize_code(self.code)
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
                    {"code": ["An organization already exists with this code."]}
                )
        return super().validate_unique(exclude=exclude)

    def create_page_role(self):
        """
        Create a new page role for the organization with:
          - a user group to handle permissions for admins of this organization,
          - a folder in Django Filer to store images related to this organization,
          - all necessary permissions.
        """
        if not getattr(settings, "CMS_PERMISSION", False):
            return None

        # The page role is only created for draft organizations
        if not self.extended_object.publisher_is_draft:
            return None

        # Don't do anything if it already exists
        page_role = PageRole.objects.filter(
            page=self.extended_object, role=defaults.ADMIN
        ).first()

        if page_role:
            return page_role

        # Create a role for admins of this organization (which will automatically create a new
        # user group and a new Filer folder)
        page_role = PageRole.objects.create(
            page=self.extended_object, role=defaults.ADMIN
        )

        # Associate permissions as defined in settings:
        # - Create Django permissions
        page_role.group.permissions.set(
            get_permissions(
                defaults.ORGANIZATION_ADMIN_ROLE.get("django_permissions", [])
            )
        )

        # - Create DjangoCMS page permissions
        PagePermission.objects.create(
            group_id=page_role.group_id,
            page=self.extended_object,
            **defaults.ORGANIZATION_ADMIN_ROLE.get("organization_page_permissions", {}),
        )

        # - Create the Django Filer folder permissions
        FolderPermission.objects.create(
            folder_id=page_role.folder_id,
            group_id=page_role.group_id,
            **defaults.ORGANIZATION_ADMIN_ROLE.get(
                "organization_folder_permissions", {}
            ),
        )
        return page_role

    def save(self, *args, **kwargs):
        """
        Enforce validation on each instance save
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def get_courses(self, language=None):
        """
        Return a query to get the courses related to this organization ie for which a plugin for
        this organization is linked to the course page via any placeholder.
        """
        return self.get_reverse_related_page_extensions(
            "course", language=language
        ).filter(extended_object__node__parent__cms_pages__course__isnull=True)

    def get_persons(self, language=None):
        """
        Return a query to get the persons related to this organization ie for which a plugin for
        this organization is linked to the person page via any placeholder.
        """
        return self.get_reverse_related_page_extensions("person", language=language)

    @staticmethod
    def get_organizations_codes(page, language: str):
        """
        Return organization attached to the page and
        organizations linked to the current page via an organization plugin in any of the
        placeholders on the page.
        """
        return (
            Organization.objects.filter(
                Q(
                    extended_object__organization_plugins__cmsplugin_ptr__language=language,
                    extended_object__organization_plugins__cmsplugin_ptr__placeholder__page=page,  # noqa pylint: disable=line-too-long
                )
                | Q(
                    extended_object__exact=page,
                ),
                extended_object__title_set__published=True,
                code__isnull=False,
            )
            .distinct()
            .order_by("code")
            .values_list("code", flat=True)
        )


class OrganizationPluginModel(CMSPlugin):
    """
    Organization plugin model handles the relation from OrganizationPlugin
    to their Organization instance
    """

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="organization_plugins",
        limit_choices_to={
            "publisher_is_draft": True,  # plugins work with draft instances
            "organization__isnull": False,  # limit to pages linked to an organization object
        },
    )
    variant = models.CharField(
        _("variant"),
        max_length=50,
        choices=defaults.ORGANIZATION_GLIMPSE_VARIANT_CHOICES,
        help_text=_("Optional glimpse variant for a custom look."),
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "richie_organization_plugin"
        verbose_name = _("organization plugin")
        verbose_name_plural = _("organization plugins")

    def __str__(self):
        """Human representation of a page plugin"""
        return self.page.get_title()


class OrganizationsByCategoryPluginModel(CMSPlugin):
    """
    Handle the relation between a OrganizationsByCategoryPlugin plugin and its Category
    instance.
    """

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="organizations_by_category_plugins",
        limit_choices_to={
            "publisher_is_draft": True,  # plugins work with draft instances
            "category__isnull": False,  # limit to pages linked to a category object
        },
    )
    variant = models.CharField(
        _("variant"),
        max_length=50,
        choices=defaults.ORGANIZATION_GLIMPSE_VARIANT_CHOICES,
        help_text=_("Optional glimpse variant for a custom look."),
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "richie_organizations_by_category_plugin"
        verbose_name = _("organizations by category plugin")
        verbose_name_plural = _("organizations by category plugins")


extension_pool.register(Organization)
