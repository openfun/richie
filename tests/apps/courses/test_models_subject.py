"""
Unit tests for the Subject model
"""
from django.test import TestCase

from cms.api import create_page

from richie.apps.core.helpers import create_i18n_page
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
                    course.extended_object.prefetched_titles[0].title, "my title"
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

    def test_models_subject_get_courses_snapshots(self):
        """
        Snapshot courses should be excluded from the list of courses returned.
        The new filter query we added to exclude snapshots should not create duplicates.
        Indeed, we had to add a "distinct" clause to the query so this test enforces it.
        """
        # We create a root page because it was responsible for duplicate results when the
        # distinct clause is not applied.
        # This is because of the clause "extended_object__node__parent__cms_pages__..."
        # which is there to exclude snapshots but also acts on the main course page and
        # checks its parent (so the root page) and the duplicate comes from the fact that
        # the parent has a draft and a public page... so "cms_pages" has a cardinality of 2
        root_page = create_i18n_page(published=True)

        subject = SubjectFactory(should_publish=True)
        course = CourseFactory(
            parent=root_page, fill_subjects=[subject], should_publish=True
        )
        CourseFactory(
            parent=course.extended_object, fill_subjects=[subject], should_publish=True
        )

        self.assertEqual(Course.objects.count(), 4)
        self.assertEqual(subject.get_courses().count(), 1)
        self.assertEqual(subject.public_extension.get_courses().count(), 1)
