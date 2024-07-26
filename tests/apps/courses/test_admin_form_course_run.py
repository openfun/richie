"""
Test suite covering the admin form for the CourseRun model
"""

from django.test.client import RequestFactory
from django.test.utils import override_settings
from django.utils import translation

from cms.models import PagePermission
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.admin import CourseRunAdminForm
from richie.apps.courses.factories import CourseFactory, CourseRunFactory


class CourseRunAdminTestCase(CMSTestCase):
    """
    Test suite to validate the behavior of admin form for the CourseRun model
    """

    @staticmethod
    def _get_admin_form(course, user):
        """Helper method to create a course run admin form for testing."""
        data = {
            "direct_course": course.id,
            "title": "Title",
            "languages": ["fr", "en"],
            "resource_link": "https://example.com",
            "start_0": "2015-01-15",
            "start_1": "07:06:15",
            "end_0": "2015-01-30",
            "end_1": "23:52:34",
            "enrollment_start_0": "2015-01-02",
            "enrollment_start_1": "13:13:07",
            "enrollment_end_0": "2015-01-23",
            "enrollment_end_1": "09:07:11",
            "catalog_visibility": "course_and_search",
            "price_currency": "EUR",
            "offer": "free",
            "price": 0.0,
            "certificate_offer": "free",
            "certificate_price": 0.0,
            "sync_mode": "manual",
            "display_mode": "detailed",
        }

        request = RequestFactory().get("/")
        request.user = user
        CourseRunAdminForm.request = request
        return CourseRunAdminForm(data=data)

    # Validation

    def test_admin_form_course_run_superuser(self):
        """A superuser can submit a form without any further permissions."""
        course = CourseFactory()
        user = UserFactory(is_staff=True, is_superuser=True)
        form = self._get_admin_form(course, user)

        self.assertTrue(form.is_valid())

    def test_admin_form_course_run_staff_missing_permissions(self):
        """
        A staff user with missing page permissions submitting a course run admin form should
        see an error message, unless CMS permissions are not activated.
        """
        course = CourseFactory()
        user = UserFactory(is_staff=True)
        self.add_permission(user, "change_page")

        form = self._get_admin_form(course, user)

        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "direct_course": [
                    "You do not have permission to change this course page."
                ]
            },
        )

        # But it should work if CMS permissions are not activated
        form = self._get_admin_form(course, user)
        with override_settings(CMS_PERMISSION=False):
            self.assertTrue(form.is_valid())

    def test_admin_form_course_run_staff_all_permissions(self):
        """A staff user with all permissions can submit a form."""
        course = CourseFactory()
        user = UserFactory(is_staff=True)

        self.add_permission(user, "change_page")
        PagePermission.objects.create(
            page=course.extended_object,
            user=user,
            can_add=False,
            can_change=True,
            can_delete=False,
            can_publish=False,
            can_move_page=False,
        )

        form = self._get_admin_form(course, user)

        self.assertTrue(form.is_valid())

    def test_admin_form_course_run_superuser_empty_form(self):
        """A user submitting an empty form should see error messages for required fields."""
        user = UserFactory(is_staff=True, is_superuser=True)
        factory = RequestFactory()
        request = factory.get("/")
        request.user = user
        CourseRunAdminForm.request = request
        form = CourseRunAdminForm(data={"resource_link": "https://example.com"})

        self.assertFalse(form.is_valid())

        for field in [
            "direct_course",
            "display_mode",
            "languages",
            "catalog_visibility",
            "sync_mode",
        ]:
            self.assertEqual(form.errors[field], ["This field is required."])

    # Direct course choices

    def test_admin_form_course_run_choices_superuser_one_course(self):
        """
        If there is only 1 course, the choice is implicit and the "direct_course" field is hidden.
        """
        course = CourseFactory(page_title="Title", should_publish=True)
        user = UserFactory(is_staff=True, is_superuser=True)
        form = self._get_admin_form(course, user)

        self.assertEqual(len(form.fields["direct_course"].choices), 2)
        self.assertIn(
            (
                f'<input type="hidden" name="direct_course" value="{course.id:d}" '
                'id="id_direct_course">'
            ),
            form.as_ul(),
        )

    def test_admin_form_course_run_choices_superuser_several_courses(self):
        """
        If there are several courses, a superuser should see them in the "direct_course" field.
        """
        course1 = CourseFactory(page_title="Title 1", should_publish=True)
        course2 = CourseFactory(page_title="Title 2", should_publish=True)
        user = UserFactory(is_staff=True, is_superuser=True)
        form = self._get_admin_form(course2, user)

        self.assertEqual(len(form.fields["direct_course"].choices), 3)
        html = form.as_ul()
        self.assertIn('<option value="">---------</option>', html)
        self.assertIn(f'<option value="{course1.id:d}">Title 1</option>', html)
        self.assertIn(f'<option value="{course2.id:d}" selected>Title 2</option>', html)

    def test_admin_form_course_run_choices_superuser_several_courses_initial(self):
        """
        If there are several courses but an initial value is passed for the "direct_course" field,
        the choice is made and the "direct_course" field is hidden.
        """
        course = CourseFactory(page_title="Title 1", should_publish=True)
        CourseFactory(page_title="Title 2", should_publish=True)
        user = UserFactory(is_staff=True, is_superuser=True)

        request = RequestFactory().get("/")
        request.user = user
        CourseRunAdminForm.request = request
        form = CourseRunAdminForm(initial={"direct_course": course.id})

        self.assertEqual(len(form.fields["direct_course"].choices), 3)
        self.assertIn(
            (
                f'<input type="hidden" name="direct_course" value="{course.id:d}" '
                'id="id_direct_course">'
            ),
            form.as_ul(),
        )

    def test_admin_form_course_run_choices_staff_permissions(self):
        """
        Staff users should only see course pages on which they have change permission.
        Unless CMS permissions are not activated.
        """
        course1 = CourseFactory(page_title="Title 1", should_publish=True)
        course2 = CourseFactory(page_title="Title 2", should_publish=True)
        course3 = CourseFactory(page_title="Title 3", should_publish=True)
        user = UserFactory(is_staff=True)

        # Add permission only for courses 2 and 3
        self.add_permission(user, "change_page")
        for course in [course2, course3]:
            PagePermission.objects.create(
                page=course.extended_object,
                user=user,
                can_add=False,
                can_change=True,
                can_delete=False,
                can_publish=False,
                can_move_page=False,
            )

        # The user should only see the 2 courses on which he has permissions
        form = self._get_admin_form(course2, user)
        self.assertEqual(len(form.fields["direct_course"].choices), 3)
        html = form.as_ul()
        self.assertIn('<option value="">---------</option>', html)
        self.assertNotIn("Title 1", html)
        self.assertIn(f'<option value="{course2.id:d}" selected>Title 2</option>', html)
        self.assertIn(f'<option value="{course3.id:d}">Title 3</option>', html)

        # Unless CMS permissions are not activated
        with override_settings(CMS_PERMISSION=False):
            form = self._get_admin_form(course2, user)

        self.assertEqual(len(form.fields["direct_course"].choices), 4)
        self.assertIn(f'<option value="{course1.id:d}">Title 1</option>', form.as_ul())

    def test_admin_form_course_run_choices_instance(self):
        """
        A course run admin form bound to an instance lists the related course and its snapshots.
        It is not proposed to move the course run to another unrelated course.
        """
        course = CourseFactory(page_title="Title 1", should_publish=True)
        snapshot = CourseFactory(
            page_title="Title 1 Snapshot",
            page_parent=course.extended_object,
            should_publish=True,
        )
        CourseFactory(page_title="Title 2", should_publish=True)
        user = UserFactory(is_staff=True, is_superuser=True)
        course_run = CourseRunFactory(direct_course=course)

        # Get form bound to the course run instance
        request = RequestFactory().get("/")
        request.user = user
        CourseRunAdminForm.request = request
        form = CourseRunAdminForm(instance=course_run)

        self.assertEqual(len(form.fields["direct_course"].choices), 3)
        html = form.as_ul()
        self.assertIn('<option value="">---------</option>', html)
        self.assertIn(f'<option value="{course.id:d}" selected>Title 1</option>', html)
        self.assertIn(
            f'<option value="{snapshot.id:d}">Title 1 Snapshot</option>', html
        )

    def test_admin_form_course_run_choices_languages(self):
        """The languages field choices should be sorted alphabetically by localized values."""
        user = UserFactory(is_staff=True, is_superuser=True)

        request = RequestFactory().get("/")
        request.user = user
        CourseRunAdminForm.request = request

        form = CourseRunAdminForm()
        self.assertEqual(form.fields["languages"].choices[33][1], "German")

        with translation.override("fr"):
            form = CourseRunAdminForm()
            self.assertEqual(form.fields["languages"].choices[2][1], "Allemand")
