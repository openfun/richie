"""
End-to-end tests for the category list view
"""

from datetime import timedelta
from unittest import mock

from django.utils import timezone

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.courses.factories import CategoryFactory


class ListCategoryCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the category list view
    """

    def test_templates_category_list_cms_content(self):
        """
        Validate that the public website only displays categories that are currently published,
        while staff users can see draft and unpublished categories.
        """
        page = PageFactory(
            template="courses/cms/category_list.html",
            title__language="en",
            should_publish=True,
        )

        CategoryFactory(page_parent=page, page_title="First category")
        CategoryFactory(
            page_parent=page, page_title="Second category", should_publish=True
        )

        # Publish with a publication date in the future
        future = timezone.now() + timedelta(hours=1)
        with mock.patch("cms.models.pagemodel.now", return_value=future):
            CategoryFactory(
                page_parent=page, page_title="Third category", should_publish=True
            )

        # Anonymous users should only see published categories
        response = self.client.get(page.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "First")
        self.assertContains(response, "Second")
        self.assertNotContains(response, "Third")

        # Staff users can see draft and unpublished categories
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        response = self.client.get(page.get_absolute_url())
        self.assertEqual(response.status_code, 200)

        for title in ["First", "Second", "Third"]:
            self.assertContains(response, title)
