"""
Unit tests for the template tags related to Joanie.
"""
from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.core.templatetags.joanie import is_joanie_enabled


class JoanieTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the joanie template tags
    """

    @override_settings(JOANIE={"BASE_URL": "https://joanie.endpoint"})
    def test_templatetags_is_joanie_enabled(self):
        """
        is_joanie_enabled should return True if JOANIE.BASE_URL is not None
        """
        self.assertTrue(is_joanie_enabled())

    @override_settings(JOANIE={})
    def test_templatetags_is_joanie_enabled_with_no_base_url(self):
        """
        is_joanie_enabled should return False if JOANIE["BASE_URL"] is not defined.
        """
        self.assertFalse(is_joanie_enabled())

    @override_settings(JOANIE=None)
    def test_templatetags_is_joanie_enabled_not_defined(self):
        """
        is_joanie_enabled should return False if JOANIE is not defined within
        setting
        """
        self.assertFalse(is_joanie_enabled())
