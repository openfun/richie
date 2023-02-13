"""
Courses model forms
"""

from django import forms
from django.forms import widgets
from django.urls import reverse_lazy

from dal import autocomplete
from djangocms_text_ckeditor.widgets import TextEditorWidget
from parler.forms import TranslatableModelForm

from . import models


class AdminCategoryForm(forms.ModelForm):
    """
    Category model form used within Django admin.
    """

    class Meta:
        fields = ["color"]
        model = models.Category
        widgets = {
            "color": widgets.TextInput(attrs={"type": "color", "style": "width: 5rem;"})
        }


class AdminLicenceForm(TranslatableModelForm):
    """
    Licence model form used within Django admin
    """

    class Meta:
        model = models.Licence
        widgets = {"content": TextEditorWidget}
        fields = ["name", "logo", "url", "content"]


class LicencePluginForm(forms.ModelForm):
    """
    Licence plugin form used to fill its content from frontend admin.
    """

    class Meta:
        model = models.LicencePluginModel
        widgets = {"description": TextEditorWidget}
        fields = ["licence", "description"]


# Forms for page related plugins


def get_plugin_form_widgets(model_name):
    """Get widgets definition for the plugin form of a model defined by its name."""
    return {
        "page": autocomplete.ModelSelect2(
            url=reverse_lazy(
                "page-admin-autocomplete",
                kwargs={"model_name": model_name, "version": "1.0"},
            )
        ),
    }


class BlogPostPluginForm(forms.ModelForm):
    """
    BlogPostPlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:
        fields = "__all__"
        model = models.BlogPostPluginModel
        widgets = get_plugin_form_widgets("blogpost")


class CategoryPluginForm(forms.ModelForm):
    """
    CategoryPlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:
        fields = "__all__"
        model = models.CategoryPluginModel
        widgets = get_plugin_form_widgets("category")


class CoursePluginForm(forms.ModelForm):
    """
    CoursePlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:
        fields = "__all__"
        model = models.CoursePluginModel
        widgets = get_plugin_form_widgets("course")


class OrganizationsByCategoryPluginForm(forms.ModelForm):
    """
    OrganizationsByCategoryPlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:
        fields = "__all__"
        model = models.OrganizationsByCategoryPluginModel
        widgets = get_plugin_form_widgets("category")


class OrganizationPluginForm(forms.ModelForm):
    """
    OrganizationPlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:
        fields = "__all__"
        model = models.OrganizationPluginModel
        widgets = get_plugin_form_widgets("organization")


class PersonPluginForm(forms.ModelForm):
    """
    PersonPlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:
        fields = "__all__"
        model = models.PersonPluginModel
        widgets = get_plugin_form_widgets("person")


class ProgramPluginForm(forms.ModelForm):
    """
    ProgramPlugin model form used within DjangoCMS frontend admin.
    """

    class Meta:
        fields = "__all__"
        model = models.ProgramPluginModel
        widgets = get_plugin_form_widgets("program")
