"""
Unit tests for the `course_enrollment_widget_props` template filter.
"""
import json
from datetime import timedelta
from unittest import mock

from django.utils import timezone

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
        Dashboard url is added if defined in profile_urls.
        course_enrollment_widget_props should return these properties wrapped into
        a courseRun object as a stringified json.
        """
        now = timezone.now()
        course_run = CourseRunFactory(
            resource_link=(
                "http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
            ),
            start=now + timedelta(days=1),
        )
        profile_urls = json.dumps(
            {
                "dashboard": {"action": "http://example.edx:8073/dashboard"},
                "profile": {"action": "http://example.edx:8073/u/edx"},
                "account": {"action": "http://example.edx:8073/account/settings"},
            }
        )
        context = {"run": course_run, "AUTHENTICATION": {"profile_urls": profile_urls}}

        with mock.patch.object(timezone, "now", return_value=now):
            self.assertEqual(
                course_enrollment_widget_props(context),
                json.dumps(
                    {
                        "courseRun": {
                            "id": course_run.id,
                            "resource_link": course_run.resource_link,
                            "priority": course_run.direct_course.state["priority"],
                            "starts_in_message": "The course will start in a day",
                            "dashboard_link": "http://example.edx:8073/dashboard",
                        }
                    }
                ),
            )

    def test_course_enrollment_widget_props_tag_undefined_profile_urls(self):
        """
        CourseEnrollment required id, resource_link and state.priority course run's properties.
        Dashboard url is null if not defined in profile_urls.
        course_enrollment_widget_props should return these properties wrapped into
        a courseRun object as a stringified json.
        """
        now = timezone.now()
        course_run = CourseRunFactory(
            resource_link=(
                "http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/course/"
            ),
            start=now + timedelta(days=1),
        )
        context = {"run": course_run}

        with mock.patch.object(timezone, "now", return_value=now):
            self.assertEqual(
                course_enrollment_widget_props(context),
                json.dumps(
                    {
                        "courseRun": {
                            "id": course_run.id,
                            "resource_link": course_run.resource_link,
                            "priority": course_run.direct_course.state["priority"],
                            "starts_in_message": "The course will start in a day",
                            "dashboard_link": None,
                        }
                    }
                ),
            )
