from cms.wizards.wizard_pool import wizard_pool
from cms.wizards.wizard_base import Wizard
from django.utils.translation import ugettext_lazy as _

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .forms import OrganizationForm

class OrganizationWizard(Wizard):
    """
    Simple Wizard class
    """
    pass


"""
Wizard to customize ... 
"""
organization_wizard = OrganizationWizard(
    title="New Organization",
    weight=200,
    form=OrganizationForm,
    description="Create a new Organization",
)

wizard_pool.register(organization_wizard)
