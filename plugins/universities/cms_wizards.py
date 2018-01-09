from cms.wizards.wizard_pool import wizard_pool
from cms.wizards.wizard_base import Wizard
from django.utils.translation import ugettext_lazy as _

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .forms import UniversityForm

class UniversityWizard(Wizard):
    """
    Simple Wizard class
    """
    pass


"""
Wizard to customize ... 
"""
university_wizard = UniversityWizard(
    title="New University",
    weight=200,
    form=UniversityForm,
    description="Create a new University",
)

wizard_pool.register(university_wizard)