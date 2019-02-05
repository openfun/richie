"""
Simple text plugin forms
"""
from django import forms

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .models import SimpleText


class CKEditorPluginForm(forms.ModelForm):
    """
    Plugin form used to fill its content from frontend admin.
    """

    class Meta:
        """
        Form meta attributes
        """

        model = SimpleText
        widgets = {"body": TextEditorWidget}
        fields = ["body"]
