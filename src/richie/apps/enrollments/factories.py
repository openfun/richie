"""
Factories for the enrollments app.
"""
import factory

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CourseRunFactory

from . import models


class EnrollmentFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate enrollments.
    """

    class Meta:
        model = models.Enrollment

    course_run = factory.SubFactory(CourseRunFactory)
    user = factory.SubFactory(UserFactory)

    @factory.lazy_attribute
    def created_at(self):
        """
        The enrollment should have been created during the course run's enrollment period.
        """
        return factory.Faker(
            "date_time_between_dates",
            datetime_start=self.course_run.enrollment_start,
            datetime_end=self.course_run.enrollment_end,
        ).generate()
