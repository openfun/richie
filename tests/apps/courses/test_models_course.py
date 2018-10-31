"""
Unit tests for the Course model
"""
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import CourseRun


class CourseModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Course model
    """

    def test_models_course_str(self):
        """
        The string representation should be built with the page `title`
        fields. Only 1 query to the associated page should be generated.
        """
        page = create_page("Nano particles", "courses/cms/course_detail.html", "en")
        course = CourseFactory(extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(course), "Course: Nano particles")

    def test_models_course_attribute_course_runs(self):
        """
        The "course_runs" property should return all descendants ranked by path, not only children
        and should respect publication status for the active language.
        """
        # Create a course with draft and published course runs
        course = CourseFactory(should_publish=True)

        # Create draft and published course runs for this course
        # We want to test 3 situations:
        # - a draft course run
        # - a published course run
        # - a course run that was published and unpublished
        course_runs = CourseRunFactory.create_batch(3, parent=course.extended_object)
        course_runs[0].extended_object.publish("en")
        course_runs[1].extended_object.publish("en")
        course_runs[1].extended_object.unpublish("en")

        # Create a child course with draft and published course runs (what results from
        # snapshotting a course)
        child_course = CourseFactory(parent=course.extended_object, should_publish=True)
        child_course_runs = CourseRunFactory.create_batch(
            3, parent=child_course.extended_object
        )
        child_course_runs[0].extended_object.publish("en")
        child_course_runs[1].extended_object.publish("en")
        child_course_runs[1].extended_object.unpublish("en")

        # Create another course, not related to the first one, with draft and published course runs
        other_course = CourseFactory(should_publish=True)
        other_course_runs = CourseRunFactory.create_batch(
            3, parent=other_course.extended_object
        )
        other_course_runs[0].extended_object.publish("en")
        other_course_runs[1].extended_object.publish("en")
        other_course_runs[1].extended_object.unpublish("en")

        # Check that the draft course retrieves all its descendant course runs
        # 3 draft course runs and 2 published course runs per course
        self.assertEqual(CourseRun.objects.count(), 3 * (3 + 2))
        with self.assertNumQueries(2):
            self.assertEqual(list(course.course_runs), course_runs + child_course_runs)

        # Check that the published course retrieves only the published descendant course runs
        course_runs[0].refresh_from_db()
        child_course_runs[0].refresh_from_db()
        public_course = course.public_extension
        with self.assertNumQueries(3):
            result = list(public_course.course_runs)
        self.assertEqual(
            result,
            [course_runs[0].public_extension, child_course_runs[0].public_extension],
        )
