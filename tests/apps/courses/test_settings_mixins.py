"""Unit test suite for Richie's default configuration mixin."""

from django.test import TestCase

from configurations import Configuration

from richie.apps.courses.settings.mixins import RichieCoursesConfigurationMixin


class SettingsMixinsTestCase(TestCase):
    """Validate that RichieCoursesConfigurationMixin works as expected."""

    def test_settings_mixins_value(self):
        """
        The configuration mixin should set default values for all settings listed
        in apps/courses/settings/__init__.py.
        """

        class TestConfiguration(RichieCoursesConfigurationMixin, Configuration):
            """A configuration class inheriting from Richie's configuration mixin."""

        # pylint: disable=no-member
        cms_templates = TestConfiguration().CMS_TEMPLATES
        self.assertEqual(len(cms_templates), 19)
        self.assertEqual(cms_templates[0][0], "courses/cms/course_detail.html")

    def test_settings_mixins_override(self):
        """
        A configuration class inheriting from Richie's default configuration mixin
        should be able to override the value of any setting.
        """

        class TestConfiguration(RichieCoursesConfigurationMixin, Configuration):
            """A configuration class inheriting from Richie's configuration mixin."""

            CMS_TEMPLATES = "new value"

        self.assertEqual(TestConfiguration().CMS_TEMPLATES, "new value")
