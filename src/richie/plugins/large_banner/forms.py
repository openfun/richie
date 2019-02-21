"""
Large banner plugin forms
"""
from django import forms

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .models import LargeBanner


class LargeBannerForm(forms.ModelForm):
    """
    Plugin form used to fill its content from frontend admin.
    """

    class Meta:
        """
        Form meta attributes
        """

        model = LargeBanner
        widgets = {"content": TextEditorWidget(configuration="CKEDITOR_BASIC_SETTINGS")}
        fields = [
            "title",
            "background_image",
            "logo",
            "logo_alt_text",
            "template",
            "content",
        ]
