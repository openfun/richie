"""
Validate and clean request parameters for our endpoints using Django forms
"""
from django import forms

from .defaults import FILTERS_HARDCODED
from .fields.array import ArrayField
from .fields.datetimerange import DatetimeRangeField


class CourseListForm(forms.Form):
    """
    Validate the query string params in the course list request
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add in the fields for the custom filters from defaults/settings
        for filter_key in FILTERS_HARDCODED:
            self.fields[filter_key] = FILTERS_HARDCODED[filter_key]["field"](
                choices=[
                    (value, value) for value in FILTERS_HARDCODED[filter_key]["choices"]
                ],
                required=False,
            )

    end = DatetimeRangeField(required=False)
    enrollment_end = DatetimeRangeField(required=False)
    enrollment_start = DatetimeRangeField(required=False)
    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    organizations = ArrayField(
        required=False, base_type=forms.IntegerField(min_value=0)
    )
    query = forms.CharField(required=False, min_length=3, max_length=200)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)
    start = DatetimeRangeField(required=False)
    categories = ArrayField(required=False, base_type=forms.IntegerField(min_value=0))


class OrganizationListForm(forms.Form):
    """
    Validate the query string params in the organization list request
    """

    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    query = forms.CharField(required=False, min_length=3, max_length=100)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)


class CategoryListForm(forms.Form):
    """
    Validate the query string params in the category list request
    """

    limit = forms.IntegerField(required=False, min_value=1, initial=10)
    query = forms.CharField(required=False, min_length=3, max_length=100)
    offset = forms.IntegerField(required=False, min_value=0, initial=0)
