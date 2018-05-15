"""
Test suite of the toolbar extension for course pages
"""
from django.contrib.auth.models import AnonymousUser, Permission
from django.core.exceptions import ImproperlyConfigured
from django.test.client import RequestFactory
from django.test.utils import override_settings

from cms.api import create_page
from cms.middleware.toolbar import ToolbarMiddleware
from cms.test_utils.testcases import CMSTestCase
from cms.toolbar.items import Menu, ModalItem

from apps.core.factories import UserFactory

from ..factories import CourseFactory
from ..models import Course


class CourseCMSToolbarTestCase(CMSTestCase):
    """Testing the integration of course page extensions in the toolbar"""

    @staticmethod
    def get_page_menu(page, user, edit, preview):
        """
        This method is a helper to build a request to test the toolbar in different states
        for different users
        """
        url = page.get_absolute_url()
        factory = RequestFactory()

        if edit:
            url = "{:s}?edit".format(url)
        else:
            url = "{:s}?edit_off".format(url)

        if preview:
            url = "{:s}&preview".format(url)

        request = factory.get(url)
        request.user = user
        request.current_page = page
        request.session = {}

        middleware = ToolbarMiddleware()
        middleware.process_request(request)

        # pylint: disable=no-member
        request.toolbar.get_left_items()
        return request.toolbar

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_course_has_course_settings_item(self):
        """
        Validate that a new item to edit the course is available only when visiting the page in
        edit mode and for users with permission to edit the page.
        """
        # Create different users for each possible level of access
        # pylint: disable=too-many-locals
        superuser = UserFactory(is_staff=True, is_superuser=True)
        staff_with_permission = UserFactory(is_staff=True)
        user_with_permission = UserFactory()
        staff = UserFactory(is_staff=True)
        user = UserFactory()
        anonymous = AnonymousUser()

        # Add global permission to change page for users concerned
        can_change_page = Permission.objects.get(codename="change_page")
        staff_with_permission.user_permissions.add(can_change_page)
        user_with_permission.user_permissions.add(can_change_page)

        # Create a course page
        course = CourseFactory()
        page = course.extended_object

        cases = [
            ([superuser, False, False], "disabled"),
            ([superuser, True, False], "active"),
            ([superuser, False, True], "disabled"),
            ([staff_with_permission, False, False], "disabled"),
            ([staff_with_permission, True, False], "active"),
            ([staff_with_permission, False, True], "disabled"),
            ([staff, False, False], "missing"),
            ([staff, True, False], "missing"),
            ([staff, False, True], "missing"),
            ([user_with_permission, False, False], "absent"),
            ([user_with_permission, True, False], "absent"),
            ([user_with_permission, False, True], "absent"),
            ([user, False, False], "absent"),
            ([user, True, False], "absent"),
            ([user, False, True], "absent"),
            ([anonymous, False, False], "absent"),
            ([anonymous, True, False], "absent"),
            ([anonymous, False, True], "absent"),
        ]
        admin_url = "/en/admin/courses/course/{:d}/change/".format(course.id)

        for args, state in cases:
            toolbar = self.get_page_menu(page, *args)

            if state in ["active", "disabled", "missing"]:
                page_menu_result = toolbar.find_items(Menu, name="Page")[0]
                results = page_menu_result.item.find_items(
                    ModalItem, name="Course settings..."
                )
                if state in ["active", "disabled"]:
                    self.assertEqual(len(results), 1)
                    course_item = results[0].item
                    self.assertEqual(course_item.url, admin_url)

                    if state == "active":
                        self.assertFalse(course_item.disabled)

                    elif state == "disabled":
                        self.assertTrue(course_item.disabled)

                elif state == "missing":
                    self.assertEqual(results, [])

                else:
                    raise ImproperlyConfigured()

            elif state == "absent":
                # The whole toolbar should be hidden
                self.assertEqual(toolbar.get_left_items(), [])

            else:
                raise ImproperlyConfigured()

    @override_settings(CMS_PERMISSION=False)
    def test_toolbar_course_no_course_page(self):
        """
        The toolbar should not include the item to edit the course on a page not related
        to a course page extension.
        """
        # Testing with a superuser proves our point
        superuser = UserFactory(is_staff=True, is_superuser=True)

        # Create a page not related to a course
        page = create_page("A course", template=Course.TEMPLATE_DETAIL, language="en")

        cases = [[False, False], [False, True], [True, False]]

        for args in cases:
            toolbar = self.get_page_menu(page, superuser, *args)
            page_menu = toolbar.find_items(Menu, name="Page")[0].item
            results = page_menu.find_items(ModalItem, name="Course settings...")
            self.assertEqual(results, [])
