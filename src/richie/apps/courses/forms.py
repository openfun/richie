"""
Courses model forms
"""

from django import forms
from django.forms import widgets
from django.urls import reverse_lazy

from dal import autocomplete
from djangocms_text_ckeditor.widgets import TextEditorWidget
from parler.forms import TranslatableModelForm

from .models import Category, Licence, LicencePluginModel, PersonPluginModel


class AdminCategoryForm(forms.ModelForm):
    """
    Category model form used within Django admin.
    """

    class Meta:

        fields = ["color"]
        model = Category
        widgets = {
            "color": widgets.TextInput(attrs={"type": "color", "style": "width: 5rem;"})
        }


class AdminLicenceForm(TranslatableModelForm):
    """
    Licence model form used within Django admin
    """

    class Meta:

        model = Licence
        widgets = {"content": TextEditorWidget}
        fields = ["name", "logo", "url", "content"]


class LicencePluginForm(forms.ModelForm):
    """
    Licence plugin form used to fill its content from frontend admin.
    """

    class Meta:

        model = LicencePluginModel
        widgets = {"description": TextEditorWidget}
        fields = ["licence", "description"]


class PersonPluginForm(forms.ModelForm):
    """
    PersonPlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:

        fields = "__all__"
        model = PersonPluginModel
        widgets = {
            "page": autocomplete.ModelSelect2(
                url=reverse_lazy(
                    "person-page-admin-autocomplete", kwargs={"version": "1.0"}
                )
            ),
        }
