"""
Test suite defining the admin pages for the PersonTitle model
"""
from django.core.urlresolvers import reverse

from cms.test_utils.testcases import CMSTestCase

from apps.core.factories import UserFactory

from ..factories import PersonTitleFactory
from ..models import PersonTitle


class PersonTitleAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the PersonTitle model
    """

    def test_person_title_list_view(self):
        """
        The admin list view of person titles should display title and abbreviation
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a person linked to a page
        person_title = PersonTitleFactory()

        # Get the admin list view
        url = reverse("admin:persons_persontitle_changelist")
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(response, person_title.title, status_code=200)
        self.assertContains(response, person_title.abbreviation)

    def test_person_title_add_view(self):
        """
        The admin add view should work for person title
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:persons_persontitle_add")
        response = self.client.get(url)

        # Check that the page includes all our editable fields
        for field in ["title", "abbreviation"]:
            self.assertContains(response, "id_{:s}".format(field))

    def test_person_title_change_view_get(self):
        """
        The admin change view should include the editable and readonly fields as expected.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a person title
        person_title = PersonTitleFactory()

        # Get the admin change view
        url = reverse("admin:persons_persontitle_change", args=[person_title.id])
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(response, person_title.title)
        self.assertContains(response, person_title.abbreviation)

    def test_person_change_view_post(self):
        """
        Validate that the person title can be updated via the admin.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a person, title will automaticaly be created
        person_title = PersonTitleFactory(title="Mister", abbreviation="Mr.")

        # Get the admin change view
        url = reverse("admin:persons_persontitle_change", args=[person_title.id])
        data = {"title": "Madam", "abbreviation": "Mm."}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)
        # Check that the person title was updated as expected
        person_title = PersonTitle.objects.get(id=person_title.id)
        self.assertEqual(person_title.title, "Madam")
        self.assertEqual(person_title.abbreviation, "Mm.")
