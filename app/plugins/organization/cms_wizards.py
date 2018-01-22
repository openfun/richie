
from cms.models import Page
from cms.wizards.wizard_pool import wizard_pool
from cms.wizards.wizard_base import Wizard
from django.utils.translation import ugettext_lazy as _

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .cms_apps import OrganizationApp
from .forms import OrganizationForm

class OrganizationWizard(Wizard):
    """
    Simple Wizard class
    """
    def user_has_add_permission(self, user, **kwargs):
        for page in Page.objects.all():
            if page.application_namespace == "OrganizationApp" and page.is_published(page.languages) :
                return True
        return False


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
