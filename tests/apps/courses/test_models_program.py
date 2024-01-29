"""
Unit tests for the Program model
"""

from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.models import Program


class ProgramModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Program model
    """

    def test_models_program_str(self):
        """
        The str representation should be built with the page title and code field only.
        A query to the associated page should be generated.
        """
        page = create_page("My first program", "courses/cms/program_detail.html", "en")
        program = Program(extended_object=page)
        with self.assertNumQueries(1):
            self.assertEqual(str(program), "Program: My first program")
