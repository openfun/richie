"""
Test suite for the wizard creating a new Course page
"""
from unittest import mock

from django.core.exceptions import PermissionDenied
from django.test.utils import override_settings
from django.urls import reverse
from django.utils import translation

from cms.api import Page, create_page
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_wizards import CourseRunWizardForm
from richie.apps.courses.factories import CourseFactory, CourseRunFactory
from richie.apps.courses.models import Course, CourseRun


@mock.patch("richie.apps.courses.cms_wizards.snapshot_course")
class CourseRunCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new course run pages from the CMS"""

    # Wizards list

    def test_cms_wizards_course_run_create_wizards_list_superuser_course(self, *_):
        """
        The wizard to create a new course run page should be present on the wizards list page
        for a superuser visiting a course page.
        """
        course = CourseFactory()
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(
            reverse("cms_wizard_create"), course.extended_object.id
        )
        response = self.client.get(url)

        # Check that our wizard to create course runs is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new course run page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New course run page</strong>", html=True)

    def test_cms_wizards_course_run_create_wizards_list_superuser_snapshot(self, *_):
        """
        The wizard to create a new course run page should not be present on the wizards list
        page for a superuser visiting a course snapshot page.
        """
        snapshot = CourseFactory()
        CourseFactory(page_parent=snapshot.extended_object)
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(
            reverse("cms_wizard_create"), snapshot.extended_object.id
        )
        response = self.client.get(url)

        # Check that our wizard to create course runs is not on this page
        self.assertNotContains(response, "new course run", status_code=200, html=True)

    def test_cms_wizards_course_run_create_wizards_list_superuser_not_a_course(
        self, *_
    ):
        """
        The wizard to create a new course run page should not be present on the wizards list
        page for a superuser visiting a page that is not a course.
        """
        page = create_page("page", "richie/single_column.html", "en")
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(reverse("cms_wizard_create"), page.id)
        response = self.client.get(url)

        # Check that our wizard to create course runs is not on this page
        self.assertNotContains(response, "new course run", status_code=200, html=True)

    def test_cms_wizards_course_run_create_wizards_list_insufficient_permissions(
        self, *_
    ):
        """
        The wizard to create a new course run page should not be present on the wizards list page
        for a user with insufficient permissions.
        """
        course = CourseFactory()

        required_permissions = [
            "courses.add_courserun",
            "cms.add_page",
            "cms.change_page",
        ]
        required_page_permissions = ["can_add", "can_change"]

        url = "{:s}?page={:d}".format(
            reverse("cms_wizard_create"), course.extended_object.id
        )

        for permission_to_be_removed in required_permissions + [None]:
            for page_permission_to_be_removed in required_page_permissions + [None]:
                if (
                    permission_to_be_removed is None
                    and page_permission_to_be_removed is None
                ):
                    # This is the case of sufficient permissions treated in the next test
                    continue

                altered_permissions = required_permissions.copy()
                if permission_to_be_removed:
                    altered_permissions.remove(permission_to_be_removed)

                altered_page_permissions = required_page_permissions.copy()
                if page_permission_to_be_removed:
                    altered_page_permissions.remove(page_permission_to_be_removed)

                user = UserFactory(is_staff=True, permissions=altered_permissions)
                self.client.login(username=user.username, password="password")

                # Let the authorized user get the page with all wizards listed
                response = self.client.get(url)

                # Check that our wizard to create course runs is not on this page
                self.assertNotContains(
                    response, "course run", status_code=200, html=True
                )

    def test_cms_wizards_course_run_create_wizards_list_user_with_permissions(self, *_):
        """
        The wizard to create a new course run page should be present on the wizards list page
        for a user with the required permissions.
        """
        course = CourseFactory()

        # Login with a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_courserun", "cms.add_page", "cms.change_page"],
        )
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = "{:s}?page={:d}".format(
            reverse("cms_wizard_create"), course.extended_object.id
        )
        response = self.client.get(url)

        # Check that our wizard to create course runs is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new course run page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(response, "<strong>New course run page</strong>", html=True)

    # Form submission

    def test_cms_wizards_course_run_submit_form_not_a_course(self, mock_snapshot):
        """
        Submitting a valid CourseRunWizardForm on a page that is not a course should raise
        a validation error.
        """
        page = create_page("page", "richie/single_column.html", "en")

        # Submit a valid form
        form = CourseRunWizardForm(
            data={"title": "My title"}, wizard_language="en", wizard_page=page
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {"__all__": ["Course runs can only be created from a course page."]},
        )
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_submit_form_insufficient_permission(self, *_):
        """
        A user with insufficient permissions trying to submit a CourseRunWizardForm should trigger
        a PermissionDenied exception.
        We make loop to remove each time only one permission from the set of required permissions
        and check that they are all required.
        """
        course = CourseFactory()

        required_permissions = ["courses.add_courserun"]

        for is_staff in [True, False]:
            for permission_to_be_removed in required_permissions + [None]:
                if is_staff is True and permission_to_be_removed is None:
                    # This is the case of sufficient permissions treated in the next test
                    continue

                altered_permissions = required_permissions.copy()
                if permission_to_be_removed:
                    altered_permissions.remove(permission_to_be_removed)

                user = UserFactory(is_staff=is_staff, permissions=altered_permissions)

                form = CourseRunWizardForm(
                    data={"title": "My title"},
                    wizard_language="en",
                    wizard_user=user,
                    wizard_page=course.extended_object,
                )

                with self.assertRaises(PermissionDenied):
                    form.is_valid()

    def test_cms_wizards_course_run_submit_form_success(self, mock_snapshot):
        """
        A user with the required permissions submitting a valid CourseRunWizardForm should be able
        to create a course run and its related page.
        """
        course = CourseFactory()

        # Create a user with just the required permissions
        user = UserFactory(
            is_staff=True,
            permissions=["courses.add_courserun", "cms.add_page", "cms.change_page"],
        )

        # Submit a valid form
        form = CourseRunWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertTrue(form.is_valid())
        page = form.save()
        course_run = page.courserun

        # The course run and its related page should have been created as draft
        Page.objects.drafts().get(id=page.id)
        CourseRun.objects.get(id=course_run.id, extended_object=page)

        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")

        # The course run should be a child of the course page
        self.assertEqual(course_run.extended_object.parent_page, course.extended_object)

        # The languages field should have been set
        self.assertEqual(course_run.languages, ["en"])

        # Snapshot was not request and should not have been triggered
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_submit_form_max_lengths(self, mock_snapshot):
        """
        Check that the form correctly raises an error when the slug is too long. The path built
        by combining the slug of the page with the slug of its parent page, should not exceed
        255 characters in length.
        """
        # A parent page with a very long slug
        root_page = create_page(
            "p" * 100,
            "richie/single_column.html",
            "en",
            reverse_id=Course.PAGE["reverse_id"],
        )
        course = CourseFactory(page_title="c" * 100, page_parent=root_page)

        # A course run with a slug at the limit length should work
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data={"title": "t" * 53},
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )
        self.assertTrue(form.is_valid())
        form.save()

        # A course run with a slug too long with regards to the parent's one should raise an error
        form = CourseRunWizardForm(
            data={"title": "t" * 54},
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            (
                "This slug is too long. The length of the path built by prepending the slug of "
                "the parent page would be 256 characters long and it should be less than 255"
            ),
        )

        # Snapshot was not request and should not have been triggered
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_submit_form_slugify_long_title(self, mock_snapshot):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A course should pre-exist
        course = CourseFactory()

        # Submit a title at max length
        data = {"title": "t" * 255}
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data=data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

        # Snapshot was not request and should not have been triggered
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_submit_form_title_too_long(self, mock_snapshot):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A course should pre-exist
        course = CourseFactory()

        # Submit a title that is too long
        invalid_data = {"title": "t" * 256}

        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data=invalid_data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

        # Snapshot was not request and should not have been triggered
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_submit_form_slug_too_long(self, mock_snapshot):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A course should pre-exist
        course = CourseFactory()

        # Submit a slug that is too long and a title that is ok
        invalid_data = {"title": "t" * 255, "slug": "s" * 201}

        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data=invalid_data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

        # Snapshot was not request and should not have been triggered
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_submit_form_invalid_slug(self, mock_snapshot):
        """Trying to submit a slug that is not valid should raise a 400 exception."""
        # A course should pre-exist
        course = CourseFactory()

        # Submit an invalid slug
        data = {"title": "my title", "slug": "invalid slug"}

        user = UserFactory(is_superuser=True, is_staff=True)
        form = CourseRunWizardForm(data=data, wizard_language="en", wizard_user=user)
        form.page = course.extended_object
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors["slug"][0],
            "Enter a valid 'slug' consisting of letters, numbers, underscores or hyphens.",
        )

        # Snapshot was not request and should not have been triggered
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_submit_form_slug_duplicate(self, mock_snapshot):
        """
        Trying to create a course run with a slug that would lead to a duplicate path should
        raise a validation error.
        """
        # A course should pre-exist
        course = CourseFactory()
        # Create an existing page with a known slug
        CourseRunFactory(page_parent=course.extended_object, page_title="My title")

        # Submit a title that will lead to the same slug
        data = {"title": "my title"}

        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data=data,
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"slug": ["This slug is already in use"]})

        # Snapshot was not request and should not have been triggered
        self.assertFalse(mock_snapshot.called)

    def test_cms_wizards_course_run_language_active(self, *_):
        """
        The language should be set to the active language.
        """
        course = CourseFactory()

        # Submit a valid form
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertTrue(form.is_valid())
        with translation.override("fr"):
            page = form.save()

        # The language field should have been set to the active language
        self.assertEqual(page.courserun.languages, ["fr"])

    @override_settings(
        ALL_LANGUAGES=[("en", "English"), ("fr", "Français"), ("de", "Allemand")]
    )
    @override_settings(LANGUAGE_CODE="fr-ca")
    @override_settings(LANGUAGES=[("fr-ca", "Français Canadien")])
    @override_settings(
        CMS_LANGUAGES={1: [{"code": "fr-ca", "name": "Français Canadien"}]}
    )
    def test_cms_wizards_course_run_language_active_not_in_all_languages(self, *_):
        """
        If the ALL_LANGUAGES setting does not include the full active language, it should match
        on the simple language prefix.
        """
        course = CourseFactory(page_title={"fr-ca": "my title"})

        # Submit a valid form
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data={"title": "My title"},
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertTrue(form.is_valid())
        with translation.override("fr-ca"):
            page = form.save()

        # The language field should have been set to the active language
        self.assertEqual(page.courserun.languages, ["fr"])

    def test_cms_wizards_course_run_snapshot(self, mock_snapshot):
        """
        Requesting a snapshot from the form to create a new course run should call the
        help function twice: once for validation and once to actually create the snapshot.
        """
        course = CourseFactory()
        user = UserFactory()

        # Submit a valid form with the snapshot flag enabled
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data={"title": "My title", "should_snapshot_course": True},
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertTrue(form.is_valid())
        self.assertEqual(mock_snapshot.call_count, 1)

        form.save()
        self.assertEqual(
            mock_snapshot.call_args_list,
            [
                mock.call(course.extended_object, user, simulate_only=True),
                mock.call(course.extended_object, user),
            ],
        )

    def test_cms_wizards_course_run_snapshot_permission_denied(self, mock_snapshot):
        """
        Requesting a snapshot when the permission is denied should call the helper function
        only once for validation and return the error message.
        """
        course = CourseFactory()
        user = UserFactory()

        # Generate a permission error on form submission
        def raise_permission_denied(*args, **kwargs):
            raise PermissionDenied("can't do that")

        mock_snapshot.side_effect = raise_permission_denied

        # Submit a valid form with the snapshot flag enabled
        user = UserFactory(is_staff=True, is_superuser=True)
        form = CourseRunWizardForm(
            data={"title": "My title", "should_snapshot_course": True},
            wizard_language="en",
            wizard_user=user,
            wizard_page=course.extended_object,
        )

        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors, {"__all__": ["can't do that"]})
        mock_snapshot.assert_called_once_with(
            course.extended_object, user, simulate_only=True
        )
