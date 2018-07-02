"""
Test suite defining the admin pages for the Person model
"""
from django.core.urlresolvers import reverse

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.persons.factories import PersonFactory, PersonTitleFactory


class PersonAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Person model
    """

    def test_person_list_view(self):
        """
        The admin list view of persons should display page title, person's title
        first_name and last_name
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a person linked to a page
        person = PersonFactory()

        # Get the admin list view
        url = reverse("admin:persons_person_changelist")
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(
            response, person.extended_object.get_title(), status_code=200
        )
        self.assertContains(response, person.first_name)
        self.assertContains(response, person.last_name)
        self.assertContains(response, person.person_title)

    def test_person_add_view(self):
        """
        The admin add view should work for person
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin change view
        url = reverse("admin:persons_person_add")
        response = self.client.get(url)

        # Check that the page includes all our editable fields
        for field in ["person_title", "first_name", "last_name"]:
            self.assertContains(response, "id_{:s}".format(field))

    def test_person_change_view_get(self):
        """
        The admin change view should include the editable and readonly fields as expected.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a person
        person = PersonFactory()

        # Get the admin change view
        url = reverse("admin:persons_person_change", args=[person.id])
        response = self.client.get(url)

        # Check that the page includes all our fields
        self.assertContains(response, person.person_title)
        self.assertContains(response, person.first_name)
        self.assertContains(response, person.last_name)

    def test_person_change_view_post(self):
        """
        Validate that the person can be updated via the admin.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a person, title will automaticaly be created
        person = PersonFactory()

        # create a new title
        new_title = PersonTitleFactory()
        # Get the admin change view
        url = reverse("admin:persons_person_change", args=[person.id])
        data = {
            "person_title": new_title.id,
            "first_name": "New First Name",
            "last_name": "New Last Name",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)

        # Check that the person was updated as expected
        person.refresh_from_db()
        self.assertEqual(person.person_title, new_title)
        self.assertEqual(person.first_name, "New First Name")
        self.assertEqual(person.last_name, "New Last Name")
