"""
Test suite of the toolbar extension for organization pages
"""
from django.test.utils import override_settings

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.items import Menu, ModalItem

from apps.core.factories import UserFactory
from apps.persons.tests.utils import CheckToolbarMixin

from ..factories import CourseFactory, OrganizationFactory


# pylint: disable=too-many-ancestors
class OrganizationCMSToolbarTestCase(CheckToolbarMixin, CMSTestCase):
    """Testing the integration of organization page extensions in the toolbar"""

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_course_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the course is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        course = CourseFactory()
        self.check_toolbar_item(course, "Course settings...")

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_organization_has_page_extension_settings_item(self):
        """
        Validate that a new item to edit the organization is available only when visiting the page
        in edit mode and for users with permission to edit the page.
        """
        organization = OrganizationFactory()
        self.check_toolbar_item(organization, "Organization settings...")

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_no_page_extension(self):
        """
        The toolbar should not include any item to edit a page extension on a page not related
        to any page extension.
        """
        # Testing with a superuser proves our point
        superuser = UserFactory(is_staff=True, is_superuser=True)

        # Create a page not related to any page extension
        page = create_page("A page", template="richie/fullwidth.html", language="en")

        cases = [[False, False], [False, True], [True, False]]

        for args in cases:
            toolbar = self.get_toolbar_for_page(page, superuser, *args)
            page_menu = toolbar.find_items(Menu, name="Page")[0].item

            # Check that the course item is absent
            results = page_menu.find_items(ModalItem, name="Course settings...")
            self.assertEqual(results, [])

            # Check that the organization item is absent
            results = page_menu.find_items(ModalItem, name="Organization settings...")
            self.assertEqual(results, [])
