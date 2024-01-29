"""
Custom fields for the course application
"""

from datetime import datetime, time

from django.forms import SplitDateTimeField
from django.forms.utils import from_current_timezone


class CourseRunSplitDateTimeField(SplitDateTimeField):
    """
    A SplitDateTime field that ignores values when only the time is set and not the date. If only
    the date is set, we use a default time value.
    """

    def has_changed(self, initial, data):
        """
        We must consider that the field has not changed, and therefore should be ignored if the
        time is our default and the date has not been set.
        """
        result = super().has_changed(initial, data)
        if initial is None and not data[0] and data[1]:
            return False
        return result

    def compress(self, data_list):
        """
        On the DateTime widget, we don't want the time to be required, only the date:
        - if the time is not set on a form, we set it to 0:00:00,
        - if only the time is set, we ignore the value.
        """
        if data_list:
            if data_list[0] in self.empty_values:
                # If there is no date, we ignore the time and act as if nothing was submitted
                return None
            if data_list[1] in self.empty_values:
                # If there is a date but no time, we take midnight as default time
                data_list[1] = time(0)
            result = datetime.combine(*data_list)
            return from_current_timezone(result)
        return None
