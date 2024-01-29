"""
create_demo_site management command tests
"""

import random
from logging import Logger
from unittest import mock

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test.utils import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses import models
from richie.apps.demo import defaults
from richie.apps.demo.management.commands.create_demo_site import create_demo_site

TEST_NB_OBJECTS = {
    "courses": 1,
    "course_courseruns": 1,
    "course_icons": 1,
    "course_organizations": 1,
    "course_persons": 1,
    "course_subjects": 1,
    "person_organizations": 1,
    "person_subjects": 1,
    "organizations": 1,
    "licences": random.randint(0, 1),
    "persons": 1,
    "blogposts": 1,
    "blogpost_categories": 1,
    "programs": 1,
    "programs_courses": 1,
    "home_blogposts": 1,
    "home_courses": 1,
    "home_organizations": 1,
    "home_subjects": 1,
    "home_persons": 1,
    "home_programs": 1,
}


class CreateDemoSiteCommandsTestCase(CMSTestCase):
    """Test the command that creates a demo site from factories with realistic fake data."""

    @override_settings(DEBUG=False)
    def test_commands_create_demo_site_force(self):
        """
        The command should not run whitout the --force option if DEBUG is False
        """
        with self.assertRaises(CommandError):
            call_command("create_demo_site")

    @override_settings(DEBUG=True)
    @mock.patch.object(Logger, "info")
    @mock.patch(
        "richie.apps.demo.management.commands.create_demo_site.create_demo_site"
    )
    def test_commands_create_demo_site_success(self, mock_create, mock_logger):
        """
        The command should delete and recreate the sample site when DEBUG is True
        The result should be posted to an info logger

        Note:
            This test confirms that the factories for each type of page are called
            as expected. It does not guarantee that the actual "create_demo_site"
            command will work if the factories themselves are not well tested.
        """
        self.assertTrue(settings.DEBUG)
        call_command("create_demo_site")
        mock_create.assert_called_once_with()
        mock_logger.assert_called_once_with("done")

    @override_settings(RICHIE_DEMO_SITE_DOMAIN="richie.education:9999")
    @override_settings(RICHIE_LMS_BACKENDS=[])
    @mock.patch(
        "richie.apps.demo.management.commands.create_demo_site.get_number_of_icons",
        return_value=1,
    )
    @mock.patch.object(
        defaults, "DEFAULT_LMS_ENDPOINT", "https://lms.richie.education:9999"
    )
    @mock.patch.dict(defaults.NB_OBJECTS, TEST_NB_OBJECTS)
    @mock.patch.dict(
        defaults.SUBJECTS_INFO,
        {
            "page_title": {"en": "Subject", "fr": "Subjet"},
            "children": [
                {
                    "page_title": {"en": "Science", "fr": "Sciences"},
                    "children": [
                        {
                            "page_title": {
                                "en": "Agronomy and Agriculture",
                                "fr": "Agronomie et Agriculture",
                            }
                        }
                    ],
                }
            ],
        },
    )
    def test_commands_create_demo_site_method(self, *_):
        """
        Validate that the create_demo_site method works (with a minimum number of pages because
        it takes a lot of time).
        """
        create_demo_site()
        self.assertEqual(models.BlogPost.objects.count(), 2)
        self.assertEqual(models.Course.objects.count(), 2)
        self.assertEqual(models.CourseRun.objects.count(), 2)
        self.assertEqual(models.Category.objects.count(), 48)
        self.assertEqual(models.Organization.objects.count(), 2)
        self.assertEqual(models.Person.objects.count(), 2)
        self.assertEqual(models.Licence.objects.count(), TEST_NB_OBJECTS["licences"])
        self.assertEqual(models.Program.objects.count(), 2)
        self.assertTrue(
            models.CourseRun.objects.first().resource_link.startswith(
                "https://lms.richie.education:9999"
            )
        )

        self.assertEqual(Site.objects.first().domain, "richie.education:9999")
