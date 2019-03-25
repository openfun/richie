"""
Unit tests for the Person model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from richie.apps.courses.factories import PersonTitleFactory


class PersonTitleModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the PersonTitle model

    Because of Django-parler we can not test model validation from Django model layer
    """

    def test_models_person_title_fields_title_required(self):
        """
        The `title` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            PersonTitleFactory(translation__title=None, translation__abbreviation="M")
        self.assertEqual(
            context.exception.message_dict, {"title": ["This field cannot be null."]}
        )

    def test_models_person_title_fields_abbreviation_required(self):
        """
        The `abbreviation` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            PersonTitleFactory(translation__abbreviation=None)
        self.assertEqual(
            context.exception.message_dict,
            {"abbreviation": ["This field cannot be null."]},
        )

    def test_models_person_title_fields_abbreviation_length(self):
        """
        The `abbreviation` field should be limited to 10 characters
        """
        PersonTitleFactory(translation__abbreviation="a" * 10)

        with self.assertRaises(ValidationError) as context:
            PersonTitleFactory(translation__abbreviation="b" * 11)
        self.assertEqual(
            context.exception.message_dict,
            {
                "abbreviation": [
                    "Ensure this value has at most 10 characters (it has 11)."
                ]
            },
        )

    def test_models_person_title_str(self):
        """
        The string representation should be built with models name,
        `title` and `abbreviation` fields
        """
        person_title = PersonTitleFactory(
            translation__title="Madam", translation__abbreviation="Mme"
        )
        self.assertEqual(str(person_title), "Person Title: Madam (Mme)")
