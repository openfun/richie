"""
Declare and configure the models for the courses application
"""
from django.contrib.auth.models import Group
from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.api import Page

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

    class Meta:
        db_table = "richie_page_role"
        verbose_name = _("page role")
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

        # Create the related group the first time the instance is saved
        if not self.group_id:
            self.group = Group.objects.create(
                name=str(self)[: Group._meta.get_field("name").max_length]
            )

        super().save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields,
        )
