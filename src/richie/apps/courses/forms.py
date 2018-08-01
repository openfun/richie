"""
Courses model forms
"""

from django import forms

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .models import Licence, LicencePluginModel


class LicencePluginForm(forms.ModelForm):
    """
    Licence plugin form used to fill its content from frontend admin.
    """

    class Meta:

        model = LicencePluginModel
        widgets = {"description": TextEditorWidget}
        fields = ["licence", "description"]


class LicenceFormAdmin(forms.ModelForm):
    """
    Licence model form used within Django admin
    """

    class Meta:

        model = Licence
        widgets = {"content": TextEditorWidget}
        fields = ["name", "logo", "url", "content"]
