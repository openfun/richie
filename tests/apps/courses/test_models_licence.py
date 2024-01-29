"""
Unit tests for the Course model
"""

from django.db import IntegrityError
from django.test import TestCase

from parler.utils.context import switch_language

from richie.apps.courses.factories import LicenceFactory


class LicenceTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Licence model
    """

    def test_models_license_fields_name_required(self):
        """
        A "name" is required when instantiating a licence.
        """
        with self.assertRaises(IntegrityError) as cm:
            LicenceFactory(name=None)
        self.assertTrue(
            # Postgresql
            'null value in column "name" violates not-null' in str(cm.exception)
            # Mysql
            or "Column 'name' cannot be null" in str(cm.exception)
        )

    def test_models_licence_fields_name_internationalized(self):
        """
        The "name" field on Licence is internationalized using django-parler.
        """
        licence = LicenceFactory(name="licence name")

        with switch_language(licence, "en"):
            self.assertEqual(licence.name, "licence name")

        with switch_language(licence, "fr"):
            self.assertEqual(licence.name, "licence name")

            licence.name = "nom de la licence"
            licence.save()

            self.assertEqual(licence.name, "nom de la licence")

        with switch_language(licence, "en"):
            self.assertEqual(licence.name, "licence name")

    def test_models_license_fields_logo_required(self):
        """
        A "logo" is required when instantiating a licence.
        """
        with self.assertRaises(IntegrityError) as cm:
            LicenceFactory(logo=None)

        self.assertTrue(
            # Postgresql
            'null value in column "logo_id" violates not-null' in str(cm.exception)
            # Mysql
            or "Column 'logo_id' cannot be null" in str(cm.exception)
        )

    def test_models_license_fields_content_required(self):
        """
        A "content" text is required when instantiating a licence.
        """
        with self.assertRaises(IntegrityError) as cm:
            LicenceFactory(content=None)

        self.assertTrue(
            # Postgresql
            'null value in column "content" violates not-null' in str(cm.exception)
            # Mysql
            or "Column 'content' cannot be null" in str(cm.exception)
        )

    def test_models_licence_fields_content_internationalized(self):
        """
        The "content" field on Licence is internationalized using django-parler.
        """
        licence = LicenceFactory(content="licence text content")

        with switch_language(licence, "en"):
            self.assertEqual(licence.content, "licence text content")

        with switch_language(licence, "fr"):
            self.assertEqual(licence.content, "licence text content")

            licence.content = "contenu textuel de la licence"
            licence.save()

            self.assertEqual(licence.content, "contenu textuel de la licence")

        with switch_language(licence, "en"):
            self.assertEqual(licence.content, "licence text content")
