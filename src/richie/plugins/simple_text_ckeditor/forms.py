"""
Simple text plugin forms
"""
from html import unescape
from unicodedata import normalize

from django import forms
from django.utils.html import strip_spaces_between_tags

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

    def clean_body(self):
        """Normalize and unescape the text submitted by CKEditor then remove useless spaces."""
        body = self.cleaned_data.get("body", "")
        body = normalize("NFKC", body)
        body = unescape(body)
        return strip_spaces_between_tags(body)
