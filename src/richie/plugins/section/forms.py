"""
Section plugin forms
"""
from django import forms

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .models import Section

CKEDITOR_CONFIGURATION_NAME = "CKEDITOR_INLINE_BOLD_CONFIGURATION"


class SectionForm(forms.ModelForm):
    """
    Plugin form used to fill its content from frontend admin.
    """

    class Meta:
        """
        Form meta attributes
        """

        model = Section
        widgets = {"title": TextEditorWidget(configuration=CKEDITOR_CONFIGURATION_NAME)}
        fields = {
            "title",
            "template",
        }
