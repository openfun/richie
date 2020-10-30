"""
Declare and configure the models for the courses application
"""
from django.apps import apps
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Prefetch
from django.utils import translation
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from cms.api import Page, PagePermission
from cms.extensions.extension_pool import extension_pool
from cms.models import CMSPlugin, Title
from filer.models import FolderPermission

from ...core.helpers import get_permissions
from ...core.models import BasePageExtension, PagePluginMixin
from .. import defaults
from .role import PageRole


class Organization(BasePageExtension):
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

    PAGE = defaults.ORGANIZATIONS_PAGE

    class Meta:
        db_table = "richie_organization"
        verbose_name = _("organization")
        ordering = ["-pk"]

    def __str__(self):
        """Human representation of an organization"""
        return "{model}: {name} ({code})".format(
            code=self.code,
            name=self.extended_object.get_title(),
            model=self._meta.verbose_name.title(),
        )

    def get_es_id(self):
        """
        An ID built with the node path and the position of this organization in the taxonomy:
            - P: parent, the organization has children
            - L: leaf, the organization has no children

        For example: a parent organization `P_00010002` and its child `L_000100020001`.
        """
        page = self.extended_object
        return f"{'L' if page.node.is_leaf() else 'P':s}-{page.node.path:s}"

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
        is_draft = self.extended_object.publisher_is_draft
        organization = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = "extended_object__placeholders__cmsplugin__courses_organizationpluginmodel__page"
        filter_dict = {
            "extended_object__node__parent__cms_pages__course__isnull": True,
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: organization.extended_object,
        }

        course_model = apps.get_model(app_label="courses", model_name="course")
        # pylint: disable=no-member
        return (
            course_model.objects.filter(**filter_dict)
            .select_related("extended_object")
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="prefetched_titles",
                    queryset=Title.objects.filter(language=language),
                )
            )
            .distinct()
        )

    def get_persons(self, language=None):
        """
        Return a query to get the persons related to this organization ie for which a plugin for
        this organization is linked to the person page via any placeholder.
        """
        is_draft = self.extended_object.publisher_is_draft
        organization = self if is_draft else self.draft_extension
        language = language or translation.get_language()

        bfs = "extended_object__placeholders__cmsplugin__courses_organizationpluginmodel__page"
        filter_dict = {
            "extended_object__publisher_is_draft": is_draft,
            "extended_object__placeholders__cmsplugin__language": language,
            bfs: organization.extended_object,
        }

        person_model = apps.get_model(app_label="courses", model_name="person")
        # pylint: disable=no-member
        return (
            person_model.objects.filter(**filter_dict)
            .select_related("extended_object")
            .prefetch_related(
                Prefetch(
                    "extended_object__title_set",
                    to_attr="prefetched_titles",
                    queryset=Title.objects.filter(language=language),
                )
            )
            .distinct()
        )


class OrganizationPluginModel(PagePluginMixin, CMSPlugin):
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


class OrganizationsByCategoryPluginModel(PagePluginMixin, CMSPlugin):
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


extension_pool.register(Organization)
