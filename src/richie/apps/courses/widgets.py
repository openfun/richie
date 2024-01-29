"""
Custom widgets for the course application
"""

from django.contrib.admin.widgets import AdminSplitDateTime
from django.utils import timezone


class CourseRunSplitDateTimeWidget(AdminSplitDateTime):
    """
    A SplitDateTime Widget that displays a default time. We can't use a Django initial value on
    the form because it would set both the date and the time.

    This widget must be combined with the "CourseRunSplitDateTimeField" so that the form knows
    how to ignore our default time if it is submitted without a date.
    """

    def get_context(self, name, value, attrs):
        """
        Fill the value of the time field with our default time.
        """
        context = super().get_context(name, value, attrs)
        if context["widget"]["subwidgets"][1]["value"] is None:
            context["widget"]["subwidgets"][1]["value"] = (
                timezone.now().replace(hour=0, minute=0, second=0, microsecond=0).time()
            )
        return context
