"""
CMS Wizard to add an organization page
Wizard only allow page creation for existing organization
"""
from django.utils.translation import ugettext_lazy as _

from cms.wizards.wizard_base import Wizard
from cms.wizards.wizard_pool import wizard_pool

from apps.courses.cms_wizards import BaseWizardForm

from .models import Organization


class OrganizationWizardForm(BaseWizardForm):
    """
    This form is used by the wizard that creates a new organization page
    A related organization model is created for each organization page
    """

    model = Organization

    def save(self):
        """
        The parent form created the page.
        This method creates the associated organization.
        """
        page = super().save()
        Organization.objects.create(extended_object=page)
        return page


wizard_pool.register(
    Wizard(
        title=_("New Organization page"),
        description=_("Create a new Organization page"),
        model=Organization,
        form=OrganizationWizardForm,
        weight=200,
    )
)
