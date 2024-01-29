"""
Unit tests for the template tags related to FeatureFlags.
"""

from django.test import TestCase
from django.test.utils import override_settings

from richie.apps.core.templatetags.feature_flags import is_feature_enabled


class FeatureFlagsTemplateTagsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the `is_feature_enabled` template tags
    """

    @override_settings(
        FEATURES={
            "TEST_FEATURE": True,
        }
    )
    def test_templatetags_is_feature_enabled_true(self):
        """
        is_feature_enabled should return True if
        an feature flags is set to True in settings.
        """
        self.assertTrue(is_feature_enabled("TEST_FEATURE"))

    @override_settings(
        FEATURES={
            "TEST_FEATURE": False,
        }
    )
    def test_templatetags_is_feature_enabled_false(self):
        """
        is_feature_enabled should return False if
        an feature flags is set to False in settings.
        """
        self.assertFalse(is_feature_enabled("TEST_FEATURE"))

    @override_settings(FEATURES={})
    def test_templatetags_is_feature_enabled_missing(self):
        """
        is_feature_enabled should return False if
        an feature flags is missing in settings.
        """
        self.assertFalse(is_feature_enabled("TEST_FEATURE"))

    def test_templatetags_settings_features_unset(self):
        """
        is_feature_enabled should return False if FEATURES
        is not defined in settings.
        """
        self.assertFalse(is_feature_enabled("TEST_FEATURE"))
