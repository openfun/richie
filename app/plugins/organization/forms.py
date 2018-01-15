from django import forms

from .models import Organization

class OrganizationForm(forms.ModelForm):
    """
    Simple ModelForm for wizard creation
    """
    class Meta:
        model = Organization
        exclude = []