"""
Base backend to connect richie with an LMS
"""

from django.conf import settings

from ..models.course import CourseRunSyncMode
from ..serializers import SyncCourseRunSerializer


class BaseLMSBackend:
    """
    Base backend to hold the methods common to all backends and provide a skeleton for others.
    """

    def __init__(self, configuration, *args, **kwargs):
        """Attach configuration to the backend instance."""
        super().__init__(*args, **kwargs)
        self.configuration = configuration

    def clean_course_run_data(self, data):
        """
        Clean course run data. By default, it does nothing, but it aims to be overridden
        by child class if there is a need to transform data payload before using it.
        """
        return data

    @staticmethod
    def get_course_run_serializer(data, partial=False):
        """Prepare data and return a bound serializer."""
        return SyncCourseRunSerializer(data=data, partial=partial)

    @property
    def default_course_run_sync_mode(self):
        """Course run synchronization mode."""
        return self.configuration.get("DEFAULT_COURSE_RUN_SYNC_MODE") or getattr(
            settings,
            "RICHIE_DEFAULT_COURSE_RUN_SYNC_MODE",
            CourseRunSyncMode.SYNC_TO_PUBLIC,
        )
