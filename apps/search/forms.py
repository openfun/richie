"""
Validate and clean request parameters for our endpoints using Django forms
"""
from django import forms


class SubjectListForm(forms.Form):
    """
    Validate the query string params in the subject list request
    """
    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    name = forms.CharField(required=False, min_length=3, max_length=100)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)
