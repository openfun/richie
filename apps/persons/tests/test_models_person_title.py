"""
Unit tests for the Person model
"""
from django.db.utils import IntegrityError, DataError
from django.test import TestCase

from ..factories import PersonTitleFactory


class PersonTitleTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the PersonTitle model

    Because of Django-parler we can not test model validation from Django model layer
    """

    def test_person_title_fields_title_required(self):
        """
        The `title` field should be required
        """
        with self.assertRaises(IntegrityError) as context:
            PersonTitleFactory(title=None)
        self.assertTrue(
            context.exception.args[0].startswith(
                'null value in column "title" violates not-null constraint'
            )
        )

    def test_person_title_fields_abbreviation_required(self):
        """
        The `abbreviation` field should be required
        """
        with self.assertRaises(IntegrityError) as context:
            PersonTitleFactory(abbreviation=None)
        self.assertTrue(
            context.exception.args[0].startswith(
                'null value in column "abbreviation" violates not-null constraint'
            )
        )

    def test_person_title_fields_abbreviation_length(self):
        """
        The `abbreviation` field should be limited to 10 characters
        """
        PersonTitleFactory(abbreviation="a" * 10)
        with self.assertRaises(DataError) as context:
            PersonTitleFactory(abbreviation="b" * 11)
        self.assertTrue(
            context.exception.args[0].startswith(
                "value too long for type character varying(10)\n"
            )
        )

    def test_person_str(self):
        """
        The string representation should be built with models name,
        `title` and `abbreviation` fields
        """
        person_title = PersonTitleFactory(title="Madam", abbreviation="Mme")
        self.assertEqual(str(person_title), "Person Title: Madam (Mme)")
