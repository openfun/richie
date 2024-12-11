"""
Unit tests for the `course_programs_count` template filter.
"""

from django.test import RequestFactory

from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses import factories
from richie.apps.courses.templatetags.extra_tags import course_programs_count


class CourseProgramsCountTagTestCase(CMSTestCase):
    """
    Unit test suite to validate the behavior of the `course_programs_count` tag.
    """

    def test_templatetags_course_programs_count_tag_with_published_courses(self):
        """
        The tag should return the number of courses available in
        a program page
        """

        (*published_courses, _other_public) = factories.CourseFactory.create_batch(
            3, should_publish=True
        )

        program = factories.ProgramFactory(
            fill_courses=published_courses, should_publish=True
        )

        request = RequestFactory().get("/")
        request.current_page = program.extended_object

        context = {"program": program, "request": request, "LANGUAGE_CODE": "en"}

        self.assertEqual(
            course_programs_count(context, request.current_page), len(published_courses)
        )

    def test_templatetags_course_programs_count_tag_without_courses(self):
        """
        The tag should return 0 if there are no courses available in
        a program page
        """
        program = factories.ProgramFactory(should_publish=True)

        request = RequestFactory().get("/")
        request.current_page = program.extended_object

        context = {"program": program, "request": request, "LANGUAGE_CODE": "en"}

        self.assertEqual(course_programs_count(context, request.current_page), 0)
