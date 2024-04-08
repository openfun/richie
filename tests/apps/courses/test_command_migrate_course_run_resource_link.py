"""Test suite for the `migrate_course_run_course_link` management command of the `courses` app."""

from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

import responses
from requests.exceptions import RequestException

from richie.apps.courses.factories import CourseRunFactory

# pylint: disable=unexpected-keyword-arg,no-value-for-parameter


@override_settings(
    JOANIE_BACKEND={"BASE_URL": "https://joanie.education", "API_TOKEN": "joanie_token"}
)
class CommandMigrateCourseRunCourseLinkTestCase(TestCase):
    """Test the `migrate_course_run_course_link` management command."""

    maxDiff = None

    @responses.activate(assert_all_requests_are_fired=True)
    def test_command_migrate_course_run_resource_link(self):
        """
        Happy path: the command should fetch the course run from the Joanie backend and update
        the course link accordingly.
        """
        course_runs = CourseRunFactory.create_batch(2)
        responses.add(
            responses.GET,
            "https://joanie.education/api/v1.0/edx_imports/course-run/"
            f"?resource_link={course_runs[0].resource_link}",
            json={"uri": "https://joanie.education/courses/edx-101"},
            status=200,
        )
        responses.add(
            responses.GET,
            "https://joanie.education/api/v1.0/edx_imports/course-run/"
            f"?resource_link={course_runs[1].resource_link}",
            json={"uri": "https://joanie.education/courses/moodle-101"},
            status=200,
        )

        call_command("migrate_course_run_resource_link")

        course_runs[0].refresh_from_db()
        self.assertEqual(
            course_runs[0].resource_link, "https://joanie.education/courses/edx-101"
        )

        course_runs[1].refresh_from_db()
        self.assertEqual(
            course_runs[1].resource_link, "https://joanie.education/courses/moodle-101"
        )

    @responses.activate(assert_all_requests_are_fired=True)
    def test_command_migrate_course_run_resource_link_joanie_fetch_fails(self):
        """
        When upgrading all course runs, if fetching one fails, the command should update all
        remaining course runs.
        """

        course_runs = CourseRunFactory.create_batch(2)
        old_resource_link = course_runs[0].resource_link
        responses.add(
            responses.GET,
            "https://joanie.education/api/v1.0/edx_imports/course-run/"
            f"?resource_link={course_runs[0].resource_link}",
            status=500,
        )
        responses.add(
            responses.GET,
            "https://joanie.education/api/v1.0/edx_imports/course-run/"
            f"?resource_link={course_runs[1].resource_link}",
            json={"uri": "https://joanie.education/courses/moodle-101"},
            status=200,
        )

        call_command("migrate_course_run_resource_link")

        course_runs[0].refresh_from_db()
        self.assertEqual(old_resource_link, course_runs[0].resource_link)

        course_runs[1].refresh_from_db()
        self.assertEqual(
            course_runs[1].resource_link, "https://joanie.education/courses/moodle-101"
        )

    @responses.activate(assert_all_requests_are_fired=True)
    def test_command_migrate_course_run_request_is_failing(self):
        """
        When upgrading all course runs, if a request is failing with a request exception,
        the command should update all the remaining course runs.
        """

        course_runs = CourseRunFactory.create_batch(2)
        old_resource_link = course_runs[0].resource_link
        responses.add(
            responses.GET,
            "https://joanie.education/api/v1.0/edx_imports/course-run/"
            f"?resource_link={course_runs[0].resource_link}",
            body=RequestException(),
        )
        responses.add(
            responses.GET,
            "https://joanie.education/api/v1.0/edx_imports/course-run/"
            f"?resource_link={course_runs[1].resource_link}",
            json={"uri": "https://joanie.education/courses/moodle-101"},
            status=200,
        )

        call_command("migrate_course_run_resource_link")

        course_runs[0].refresh_from_db()
        self.assertEqual(old_resource_link, course_runs[0].resource_link)

        course_runs[1].refresh_from_db()
        self.assertEqual(
            course_runs[1].resource_link, "https://joanie.education/courses/moodle-101"
        )
