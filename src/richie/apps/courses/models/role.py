"""
Declare and configure the models for the courses application
"""

from django.contrib.auth.models import Group
from django.db import models
from django.utils.translation import gettext_lazy as _

from cms.api import Page
from filer.models import Folder

from ..defaults import ROLE_CHOICES


class PageRole(models.Model):
    """A model to define and control by roles the permissions related to a page."""

    role = models.CharField(
        choices=ROLE_CHOICES,
        max_length=20,
        verbose_name=_("role"),
        help_text=_(
            "A role describes all the permissions that should be "
            "granted to the user group."
        ),
    )
    page = models.ForeignKey(
        to=Page,
        related_name="roles",
        verbose_name=_("page"),
        help_text=_("Page to which this role grants permissions."),
        on_delete=models.CASCADE,
        limit_choices_to={
            # permissions work with draft instances
            "publisher_is_draft": True
        },
    )
    group = models.OneToOneField(
        to=Group,
        related_name="role",
        verbose_name=_("group"),
        help_text=_("User group that this role controls."),
        on_delete=models.PROTECT,
        blank=True,
        editable=False,
    )
    folder = models.OneToOneField(
        to=Folder,
        related_name="role",
        verbose_name=_("filer folder"),
        help_text=_("Filer folder that this role controls."),
        on_delete=models.PROTECT,
        blank=True,
        editable=False,
    )

    class Meta:
        db_table = "richie_page_role"
        verbose_name = _("page role")
        verbose_name_plural = _("page roles")
        unique_together = ("page", "role")

    def __str__(self):
        """Human representation of a page role."""
        return _("{:s} | {:s}").format(self.get_role_display(), self.page.get_title())

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None
    ):
        """
        Validate the object before saving it and create a group if it does not exist yet.
        """
        self.full_clean(exclude=["group"])
        page_id = str(self.page.id)

        # Create the related group the first time the instance is saved
        if not self.group_id:
            name = str(self)[: Group._meta.get_field("name").max_length]

            if Group.objects.filter(name=name).exists():
                name = f"{name:s} [{page_id:s}]"[
                    : Group._meta.get_field("name").max_length
                ]

            self.group = Group.objects.create(name=name)

        # Create the related filer folder the first time the instance is saved.
        # Why create this folder at the root and not below a parent `organization` folder?
        # - the only way to refer to an existing parent folder is by its name... but it could be
        #   changed by a user via the interface and break the functionality,
        # - the filer search functionality only finds folders at the root, not nested folders.
        if not self.folder_id:
            name = str(self)[: Folder._meta.get_field("name").max_length]

            if Folder.objects.filter(name=name).exists():
                name = f"{name:s} [{page_id:s}]"[
                    : Folder._meta.get_field("name").max_length
                ]

            self.folder = Folder.objects.create(name=name)

        super().save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields,
        )
