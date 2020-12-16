"""
Unit tests for the `course_enrollment_widget_props` template filter.
"""
import json

from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CourseRunFactory
from richie.apps.courses.templatetags.extra_tags import course_enrollment_widget_props


class CourseEnrollmentWidgetPropsTagTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the `course_enrollment_widget_props` tag
    """

    def test_course_enrollment_widget_props_tag(self):
        """
        CourseEnrollment required id, resource_link and state.priority course run's properties.
        course_enrollment_widget_props should return these properties wrapped into
        a courseRun object as a stringified json.
        """
        course_run = CourseRunFactory(
            resource_link="http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
        )
        context = {"run": course_run}
        self.assertEqual(
            course_enrollment_widget_props(context),
            json.dumps(
                {
                    "courseRun": {
                        "id": course_run.id,
                        "resource_link": course_run.resource_link,
                        "priority": course_run.direct_course.state["priority"],
                    }
                }
            ),
        )
