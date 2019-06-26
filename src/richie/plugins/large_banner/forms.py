"""
Large banner plugin forms
"""
import warnings

from django import forms
from django.conf import settings

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .models import LargeBanner

CKEDITOR_CONFIGURATION_NAME = "CKEDITOR_BASIC_CONFIGURATION"

# Fallback to the old setting name for backward compatibility
if getattr(settings, "CKEDITOR_BASIC_SETTINGS", None) and not getattr(
    settings, "CKEDITOR_BASIC_CONFIGURATION", None
):
    warnings.warn(
        '"CKEDITOR_BASIC_SETTINGS" is deprecated and renamed to "CKEDITOR_BASIC_CONFIGURATION"',
        DeprecationWarning,
        stacklevel=0,
    )
    CKEDITOR_CONFIGURATION_NAME = "CKEDITOR_BASIC_SETTINGS"


class LargeBannerForm(forms.ModelForm):
    """
    Plugin form used to fill its content from frontend admin.
    """

    class Meta:
        """
        Form meta attributes
        """

        model = LargeBanner
        widgets = {
            "content": TextEditorWidget(configuration=CKEDITOR_CONFIGURATION_NAME)
        }
        fields = [
            "title",
            "background_image",
            "logo",
            "logo_alt_text",
            "template",
            "content",
        ]
