"""
Unit tests for the Subject model
"""
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import SubjectFactory


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
