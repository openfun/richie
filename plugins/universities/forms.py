from django import forms

from .models import University

class UniversityForm(forms.ModelForm):
    """
    Simple ModelForm for wizard creation
    """
    class Meta:
        model = University
        exclude = []