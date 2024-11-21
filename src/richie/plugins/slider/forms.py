"""
Slider plugin forms
"""

from django import forms

from djangocms_text_ckeditor.widgets import TextEditorWidget

from .models import SlideItem, Slider


class SliderForm(forms.ModelForm):
    """
    Slider form used to fill its content from frontend admin.
    """

    class Meta:
        model = Slider
        fields = [
            "title",
        ]


class SlideItemForm(forms.ModelForm):
    """
    SlideItem form used to fill its content from frontend admin.
    """

    class Meta:
        model = SlideItem
        fields = [
            "title",
            "image",
            "content",
            "link_url",
            "link_open_blank",
        ]
        widgets = {
            "content": TextEditorWidget,
        }
