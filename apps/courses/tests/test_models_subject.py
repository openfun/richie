"""
Unit tests for the Subject model
"""
from django.test import TestCase

from cms.api import create_page

from ..factories import CourseFactory, SubjectFactory
from ..models import Subject


class SubjectTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Subject model
    """

    def test_subject_str(self):
        """
        The string representation should be built with the title of the related page.
        Only 1 query to the associated page should be generated.
        """
        page = create_page("Art", "courses/cms/subject_detail.html", "en")
        subject = SubjectFactory(extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(subject), "Subject: Art")

    def test_subject_courses_copied_when_publishing(self):
        """
        When publishing a subject, the courses on the draft version of the subject
        should be copied (clear then add) to the published version.
        """
        course1, course2 = CourseFactory.create_batch(2)
        draft_subject = SubjectFactory(with_courses=[course1, course2])

        # Publish the subject and check that the courses are copied
        draft_subject.extended_object.publish("en")
        published_subject = Subject.objects.get(
            extended_object__publisher_is_draft=False
        )
        self.assertEqual(set(published_subject.courses.all()), {course1, course2})

        # When publishing, the courses that are obsolete should be cleared
        draft_subject.courses.remove(course2)
        self.assertEqual(set(published_subject.courses.all()), {course1, course2})
        # Courses on the published subject are only cleared after publishing the draft page
        draft_subject.extended_object.publish("en")
        self.assertEqual(set(published_subject.courses.all()), {course1})
