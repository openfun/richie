"""
Unit tests for the Subject model
"""
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import CourseFactory, SubjectFactory
from richie.apps.courses.models import Course


class SubjectModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Subject model
    """

    def test_models_subject_str(self):
        """
        The string representation should be built with the title of the related page.
        Only 1 query to the associated page should be generated.
        """
        page = create_page("Art", "courses/cms/subject_detail.html", "en")
        subject = SubjectFactory(extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(subject), "Subject: Art")

    def test_models_subject_get_courses(self):
        """
        It should be possible to retrieve the list of related courses on the subject instance.
        The number of queries should be minimal.
        """
        subject = SubjectFactory(should_publish=True)
        courses = CourseFactory.create_batch(
            3, fill_subjects=[subject], title="my title", should_publish=True
        )
        retrieved_courses = subject.get_courses()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_courses), set(courses))

        with self.assertNumQueries(0):
            for course in retrieved_courses:
                self.assertEqual(
                    course.extended_object.prefetched_titles[0].title, "my title en"
                )

    def test_models_subject_get_courses_several_languages(self):
        """
        The courses should not be duplicated if they exist in several languages.
        """
        subject = SubjectFactory(should_publish=True)
        CourseFactory(
            title={"en": "my title", "fr": "mon titre"},
            fill_subjects=[subject],
            should_publish=True,
        )
        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(subject.get_courses().count(), 1)
