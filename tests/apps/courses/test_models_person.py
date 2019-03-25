"""
Unit tests for the Person model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from cms.api import create_page

from richie.apps.courses.factories import PersonFactory


class PersonModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Person model
    """

    def test_models_person_fields_first_name_required(self):
        """
        The `first_name` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            PersonFactory(first_name=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_models_person_fields_last_name_required(self):
        """
        The `last_name` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            PersonFactory(last_name=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_models_person_fields_person_title_not_required(self):
        """
        The `person_title` field should not be required
        """
        person = PersonFactory(person_title=None)
        self.assertIsNone(person.person_title)

    def test_models_person_str(self):
        """
        The string representation should be built with the page `title`
        and all person fields. Only 1 query to the associated page should be generated.
        """
        page = create_page(
            "Page of Lady Louise Dupont", "courses/cms/person_detail.html", "en"
        )
        person = PersonFactory(
            extended_object=page,
            first_name="Louise",
            last_name="Dupont",
            person_title__translation__title="Madam",
            person_title__translation__abbreviation="Mme",
        )
        with self.assertNumQueries(3):
            self.assertEqual(
                str(person), "Person: Page of Lady Louise Dupont (Madam Louise Dupont)"
            )

    def test_models_person_get_full_name(self):
        """
        The get_full_name method should return title, first name and last name separated by space.
        No SQL query should be generated.
        """
        person1 = PersonFactory(
            first_name="Louise",
            last_name="Dupont",
            person_title__translation__title="Madam",
            person_title__translation__abbreviation="Mme",
        )
        person2 = PersonFactory(
            first_name="Jacques", last_name="Martin", person_title=None
        )
        with self.assertNumQueries(1):
            self.assertEqual(person1.get_full_name(), "Madam Louise Dupont")
            self.assertEqual(person2.get_full_name(), "Jacques Martin")
