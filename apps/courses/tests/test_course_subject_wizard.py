"""
Test suite for the wizard creating a new CourseSubject page
"""
from django.core.urlresolvers import reverse

from cms.api import create_page
from cms.models import Page
from cms.test_utils.testcases import CMSTestCase

from apps.core.factories import UserFactory

from ..cms_wizards import CourseSubjectWizardForm
from ..factories import CourseSubjectFactory
from ..models import CourseSubjectPage, COURSE_SUBJECTS_PAGE_REVERSE_ID


class CourseSubjectCMSWizardTestCase(CMSTestCase):
    """Testing the wizard that is used to create new course subject pages from the CMS"""

    def test_course_subject_create_wizards_list(self):
        """
        The wizard to create a new CourseSubjct page should be present on the wizards list page
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Let the authorized user get the page with all wizards listed
        url = reverse("cms_wizard_create")
        response = self.client.get(url)

        # Check that our wizard to create courses is on this page
        self.assertContains(
            response,
            '<span class="info">Create a new course subject page</span>',
            status_code=200,
            html=True,
        )
        self.assertContains(
            response, "<strong>New course subject page</strong>", html=True
        )

    def test_course_subject_wizard_submit_form(self):
        """
        Submitting a valid CourseSubjectWizardForm should create a CourseSubjectPage and its
        related page.
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )
        course_subject = CourseSubjectFactory()
        # We can submit a form with just the title set
        form = CourseSubjectWizardForm(
            data={"title": "My title", "course_subject": course_subject.id}
        )
        self.assertTrue(form.is_valid())
        page = form.save()

        # Related page should have been created as draft
        self.assertEqual(Page.objects.count(), 2)
        self.assertEqual(Page.objects.drafts().count(), 2)
        self.assertEqual(page.get_title(), "My title")
        # The slug should have been automatically set
        self.assertEqual(page.get_slug(), "my-title")
        self.assertTrue(
            CourseSubjectPage.objects.filter(
                course_subject__id=course_subject.id
            ).exists()
        )

    def test_course_subject_wizard_submit_form_max_lengths(self):
        """
        Check form correctly catch error when allowed slug size would causes db error, because
        page `path` contains current slug and all previous pages slugs and is limited to 255 chars.
        """
        # A parent page with a very long slug
        create_page(
            "Subjects " + "y" * 200,
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )

        course_subject = CourseSubjectFactory()

        # A CourseSubjectPage with a correct slug, but too long regarding parent's one
        data = {
            "title": "t" * 255, "slug": "s" * 100, "course_subject": course_subject.id
        }
        form = CourseSubjectWizardForm(data=data)
        self.assertFalse(form.is_valid())
        # Error message contains variable values, so we only check the beginning
        self.assertIn("Slug size is too long", form.errors["slug"][0])

    def test_course_subject_wizard_submit_form_slugify_long_title(self):
        """
        When generating the slug from the title, we should respect the slug's "max_length"
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )

        course_subject = CourseSubjectFactory()

        # Submit a title at max length
        data = {"title": "t" * 255, "course_subject": course_subject.id}
        form = CourseSubjectWizardForm(data=data)
        self.assertTrue(form.is_valid())
        page = form.save()
        # Check that the slug has been truncated
        self.assertEqual(page.get_slug(), "t" * 200)

    def test_course_subject_wizard_submit_form_title_too_long(self):
        """
        Trying to set a title that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )

        course_subject = CourseSubjectFactory()

        # Submit a title that is too long and a slug that is ok
        invalid_data = {
            "title": "t" * 256, "slug": "s" * 200, "course_subject": course_subject.id
        }

        form = CourseSubjectWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the title being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["title"],
            ["Ensure this value has at most 255 characters (it has 256)."],
        )

    def test_course_subject_wizard_submit_form_slug_too_long(self):
        """
        Trying to set a slug that is too long should make the form invalid
        """
        # A parent page should pre-exist
        create_page(
            "Sujects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )

        course_subject = CourseSubjectFactory()

        # Submit a slug that is too long and a title that is ok
        invalid_data = {
            "title": "t" * 255, "slug": "s" * 201, "course_subject": course_subject.id
        }

        form = CourseSubjectWizardForm(data=invalid_data)
        self.assertFalse(form.is_valid())
        # Check that the slug being too long is a cause for the invalid form
        self.assertEqual(
            form.errors["slug"],
            ["Ensure this value has at most 200 characters (it has 201)."],
        )

    def test_course_subject_wizard_submit_no_title(self):
        """
        If title is not set, page title should be CourseSubject's name
        """
        # A parent page should pre-exist
        create_page(
            "Sujects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )

        course_subject = CourseSubjectFactory()

        # Submit a slug that is too long and a title that is ok
        data = {"course_subject": course_subject.id}

        form = CourseSubjectWizardForm(data=data)
        self.assertTrue(form.is_valid())
        page = form.save()

        self.assertEqual(page.get_title(), course_subject.name)

    def test_course_wizard_parent_page_should_exist(self):
        """
        We should not be able to create a CMS Course Page if the
        parent page does not exist
        """
        course_subject = CourseSubjectFactory()
        form = CourseSubjectWizardForm(
            data={
                "title": "My title",
                "slug": "my-title",
                "course_subject": course_subject.id,
            }
        )
        self.assertFalse(form.is_valid())
        self.assertEqual(
            form.errors,
            {
                "slug": [
                    "You must first create a `subjects` page and set its `reverse_id` to "
                    "`{course_subjects_reverse}`.".format(
                        course_subjects_reverse=COURSE_SUBJECTS_PAGE_REVERSE_ID
                    )
                ]
            },
        )

    def test_course_subject_wizard_only_available_subjects(self):
        """
        CourseSubject wizard should only propose CourseSubject which do not a page yet
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )

        course_subject1 = CourseSubjectFactory()
        course_subject2 = CourseSubjectFactory()

        form = CourseSubjectWizardForm()

        # Both course subjects should be present in ChoiceField
        self.assertEqual(
            set([course_subject1.id, course_subject2.id]),
            set(
                [
                    course_subject[0]
                    for course_subject in form.fields["course_subject"].choices
                ]
            ),
        )

        # create one course subject page
        data = {
            "title": "t" * 255, "slug": "s" * 50, "course_subject": course_subject1.id
        }
        form = CourseSubjectWizardForm(data=data)
        self.assertTrue(form.is_valid())
        form.save()

        form = CourseSubjectWizardForm()
        # Previously used course subject should not be present in ChoiceField
        self.assertNotIn(
            [course_subject1.id],
            [
                course_subject[0]
                for course_subject in form.fields["course_subject"].choices
            ],
        )

    def test_course_subject_wizard_no_subject_available(self):
        """
        We should not be able to validate form without `course_subject` field
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )
        data = {"title": "t" * 255, "slug": "s" * 50, "course_subject": None}
        form = CourseSubjectWizardForm(data=data)
        self.assertEqual(len(form.fields["course_subject"].choices), 0)
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors["course_subject"], ["This field is required."])

    def test_course_wizard_already_existing_course_subject(self):
        """
        We should not be able to create a course subject page for a course subject
        which already has one.
        """
        # A parent page should pre-exist
        create_page(
            "Subjects",
            "richie/fullwidth.html",
            "en",
            reverse_id=COURSE_SUBJECTS_PAGE_REVERSE_ID,
        )
        course_subject = CourseSubjectFactory()

        data = {"title": "My title", "course_subject": course_subject.id}
        form = CourseSubjectWizardForm(data=data)
        self.assertTrue(form.is_valid())
        form.save()

        # Repost same data
        form = CourseSubjectWizardForm(data=data)

        self.assertFalse(form.is_valid())
        # Error message contains select value id, so we only check the beginning
        self.assertIn("Select a valid choice.", form.errors["course_subject"][0])
