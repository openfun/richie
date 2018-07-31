"""
create_demo_site management command tests
"""
from logging import Logger
from unittest import mock

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test.utils import override_settings

from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.management.commands.create_demo_site import (
    NB_COURSES,
    NB_ORGANIZATIONS,
    NB_PERSONS,
    NB_SUBJECTS,
    PAGE_INFOS,
    create_demo_site,
)
from richie.apps.courses.factories import (
    CourseFactory,
    OrganizationFactory,
    SubjectFactory,
)
from richie.apps.persons.factories import PersonFactory


class CreateCmsDataTests(CMSTestCase):
    """Create CMS data base test case"""

    @override_settings(DEBUG=False)
    def test_command_force(self):
        """
        The command should not run whitout the --force option if DEBUG is False
        """
        with self.assertRaises(CommandError):
            call_command("create_demo_site")

    @override_settings(DEBUG=True)
    @mock.patch.object(Logger, "info")
    @mock.patch("richie.apps.core.management.commands.create_demo_site.clear_cms_data")
    @mock.patch(
        "richie.apps.core.management.commands.create_demo_site.create_demo_site"
    )
    def test_command_success(self, mock_create, mock_clear, mock_logger):
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
        mock_clear.assert_called_once_with()
        mock_create.assert_called_once_with()
        mock_logger.assert_called_once_with("done")

    @mock.patch.object(SubjectFactory, "create")
    @mock.patch.object(PersonFactory, "create")
    @mock.patch.object(OrganizationFactory, "create")
    @mock.patch.object(CourseFactory, "create")
    @mock.patch(
        "richie.apps.core.management.commands.create_demo_site.create_i18n_page"
    )
    def test_command_create_demo_site(
        self, mock_page, mock_course, mock_organization, mock_person, mock_subject
    ):  # pylint: disable=too-many-arguments
        """
        Calling the `create_demo_site` function should trigger creating root
        i18n pages and organizations below the related page

        Warning:
            @mock.patch decorators are defined in a reverse order than function
            arguments, such as first mock is for last argument and last mock
            is for first argument. Order does matter, if not respected you will
            encounter several issues with mockups.
        """
        root_pages_length = len(PAGE_INFOS)

        # Mock returns a dummy page
        mock_page.side_effect = [Page(id=i) for i in range(root_pages_length)]

        # Call the method and check its effects in what follows
        create_demo_site()

        # Check that the number of pages created is as expected
        self.assertEqual(mock_page.call_count, root_pages_length)
        self.assertEqual(mock_course.call_count, NB_COURSES)
        self.assertEqual(mock_organization.call_count, NB_ORGANIZATIONS)
        self.assertEqual(mock_subject.call_count, NB_SUBJECTS)
        self.assertEqual(mock_person.call_count, NB_PERSONS)

        # Check that the calls to create the root pages are triggered as expected
        site = Site.objects.get()
        expected_calls_for_root_pages = [
            (
                ({"en": "Home", "fr": "Accueil"},),
                {
                    "in_navigation": True,
                    "is_homepage": True,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "News", "fr": "Actualités"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "Courses", "fr": "Cours"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "reverse_id": "courses",
                    "template": "search/search.html",
                },
            ),
            (
                ({"en": "Subjects", "fr": "Sujets"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "reverse_id": "subjects",
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "Organizations", "fr": "Etablissements"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "reverse_id": "organizations",
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "Persons", "fr": "Personnes"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "reverse_id": "persons",
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "Dashboard", "fr": "Tableau de bord"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
            (
                ({"en": "About", "fr": "A propos"},),
                {
                    "in_navigation": True,
                    "is_homepage": False,
                    "published": True,
                    "site": site,
                    "template": "richie/fullwidth.html",
                },
            ),
        ]
        self.assertEqual(mock_page.call_args_list, expected_calls_for_root_pages)

        # Check that the calls to create each object were triggered as expected
        self.assertEqual(mock_course.call_count, NB_COURSES)
        self.assertEqual(mock_organization.call_count, NB_ORGANIZATIONS)
        self.assertEqual(mock_subject.call_count, NB_SUBJECTS)
        self.assertEqual(mock_person.call_count, NB_PERSONS)
