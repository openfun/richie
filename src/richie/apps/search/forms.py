"""
Validate and clean request parameters for our endpoints using Django forms
"""
from django import forms

from .fields.array import ArrayField
from .fields.datetimerange import DatetimeRangeField


class CourseListForm(forms.Form):
    """
    Validate the query string params in the course list request
    """

    end_date = DatetimeRangeField(required=False)
    enrollment_end_date = DatetimeRangeField(required=False)
    enrollment_start_date = DatetimeRangeField(required=False)
    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    organizations = ArrayField(
        required=False, base_type=forms.IntegerField(min_value=0)
    )
    query = forms.CharField(required=False, min_length=3, max_length=200)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)
    start_date = DatetimeRangeField(required=False)
    subjects = ArrayField(required=False, base_type=forms.IntegerField(min_value=0))


class OrganizationListForm(forms.Form):
    """
    Validate the query string params in the organization list request
    """

    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    query = forms.CharField(required=False, min_length=3, max_length=100)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)


class SubjectListForm(forms.Form):
    """
    Validate the query string params in the subject list request
    """

    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    query = forms.CharField(required=False, min_length=3, max_length=100)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)
