"""
Test suite defining the admin pages for the Category model
"""

from django.urls import reverse

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import CategoryFactory


class CategoryAdminTestCase(CMSTestCase):
    """
    Integration test suite to validate the behavior of admin pages for the Category model.
    """

    def test_admin_category_index(self):
        """Categories should not be listed on the index as they are page extensions."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Get the admin index view
        url = reverse("admin:index")
        response = self.client.get(url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check that a link to the category list view is not on the page
        category_url = reverse("admin:courses_category_changelist")
        self.assertNotContains(response, category_url)

    def test_admin_category_change_view_get(self):
        """The admin change view should include the color field."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a category
        category = CategoryFactory()

        # Get the admin change view
        url = reverse("admin:courses_category_change", args=[category.id])
        response = self.client.get(url)

        # Check that the page includes the color field
        self.assertContains(response, "id_color")

    def test_admin_category_change_view_post(self):
        """Validate that the category can be updated via the admin."""
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        # Create a category
        category = CategoryFactory()

        # Get the admin change view
        url = reverse("admin:courses_category_change", args=[category.id])
        data = {"color": "#c71414"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)

        # Check that the category was updated as expected
        category.refresh_from_db()
        self.assertEqual(category.color, "#c71414")
