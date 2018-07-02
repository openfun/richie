"""
Unit tests for the Person model
"""
from django.core.exceptions import ValidationError
from django.test import TestCase

from cms.api import create_page

from richie.apps.persons.factories import PersonFactory, PersonTitleFactory
from richie.apps.persons.models import Person


class PersonTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Person model
    """

    def test_person_fields_first_name_required(self):
        """
        The `first_name` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            PersonFactory(first_name=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_person_fields_last_name_required(self):
        """
        The `last_name` field should be required
        """
        with self.assertRaises(ValidationError) as context:
            PersonFactory(last_name=None)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_person_fields_person_title_required(self):
        """
        The `person_title` field should be required
        """
        # Create a page and pass it to the factory, because it can't create a CMS page
        # without a valid person_title
        page = create_page("A page", Person.TEMPLATE_DETAIL, "en")
        with self.assertRaises(ValidationError) as context:
            PersonFactory(person_title=None, extended_object=page)
        self.assertEqual(context.exception.messages[0], "This field cannot be null.")

    def test_person_str(self):
        """
        The string representation should be built with the page `title`
        and all person fields. Only 1 query to the associated page should be generated.
        """
        page = create_page(
            "Page of Lady Louise Dupont", "persons/cms/person_detail.html", "en"
        )
        person_title = PersonTitleFactory(title="Madam", abbreviation="Mme")
        person = PersonFactory(
            first_name="Louise",
            last_name="Dupont",
            person_title=person_title,
            extended_object=page,
        )
        with self.assertNumQueries(1):
            self.assertEqual(
                str(person), "Person: Page of Lady Louise Dupont (Madam Louise Dupont)"
            )
