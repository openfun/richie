"""
Unit tests for the Subject model
"""
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import CourseFactory, SubjectFactory
from richie.apps.courses.models import Subject


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

    def test_models_subject_courses_copied_when_publishing(self):
        """
        When publishing a subject, the links to draft courses on the draft version of the
        subject should be copied (clear then add) to the published version.
        Links to published courses should not be copied as they are redundant and not
        up-to-date.
        """
        # Create draft courses
        course1, course2 = CourseFactory.create_batch(2)

        # Create a draft subject
        draft_subject = SubjectFactory(with_courses=[course1, course2])

        # Publish course1
        course1.extended_object.publish("en")
        course1.refresh_from_db()

        # The draft subject should see all courses and propose a custom filter to easily access
        # the draft versions
        self.assertEqual(
            set(draft_subject.courses.all()),
            {course1, course1.public_extension, course2},
        )
        self.assertEqual(set(draft_subject.courses.drafts()), {course1, course2})

        # Publish the subject and check that the courses are copied
        draft_subject.extended_object.publish("en")
        published_subject = Subject.objects.get(
            extended_object__publisher_is_draft=False
        )
        self.assertEqual(set(published_subject.courses.all()), {course1, course2})

        # When publishing, the courses that are obsolete should be cleared
        draft_subject.courses.remove(course2)
        self.assertEqual(set(published_subject.courses.all()), {course1, course2})

        # courses on the published subject are only cleared after publishing the draft page
        draft_subject.extended_object.publish("en")
        self.assertEqual(set(published_subject.courses.all()), {course1})
