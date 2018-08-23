"""
Unit tests for the Course model
"""
from django.db import IntegrityError
from django.test import TestCase

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

        self.assertIn(
            'null value in column "name" violates not-null', str(cm.exception)
        )

    def test_models_license_fields_logo_required(self):
        """
        A "logo" is required when instantiating a licence.
        """
        with self.assertRaises(IntegrityError) as cm:
            LicenceFactory(logo=None)

        self.assertIn(
            'null value in column "logo_id" violates not-null', str(cm.exception)
        )

    def test_models_license_fields_content_required(self):
        """
        A "content" text is required when instantiating a licence.
        """
        with self.assertRaises(IntegrityError) as cm:
            LicenceFactory(content=None)

        self.assertIn(
            'null value in column "content" violates not-null', str(cm.exception)
        )
