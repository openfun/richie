"""
End-to-end tests for the blogpost detail view
"""
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    BlogPostFactory,
    CategoryFactory,
    PersonFactory,
)


class BlogPostCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the blogpost detail view
    """

    def test_templates_blogpost_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published blogpost page
        """
        author = PersonFactory(
            page_title={"en": "Comte de Saint-Germain"}, should_publish=True
        )
        blogpost = BlogPostFactory(
            page_title="Preums", fill_cover=True, fill_body=True, fill_author=[author]
        )
        page = blogpost.extended_object

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish the blogpost and ensure the content is correct
        page.publish("en")
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Preums</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="blogpost-detail__title">Preums</h1>', html=True
        )
        self.assertContains(response, "Comte de Saint-Germain", html=True)

    def test_templates_blogpost_detail_cms_draft_content(self):
        """
        A staff user should see a draft blogpost including its draft elements with an
        annotation.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        category = CategoryFactory(page_title="Very interesting category")
        author = PersonFactory(
            page_title={"en": "Comte de Saint-Germain"}, should_publish=True
        )

        blogpost = BlogPostFactory(
            page_title="Preums",
            fill_cover=True,
            fill_body=True,
            fill_categories=[category],
            fill_author=[author],
        )
        page = blogpost.extended_object

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Preums</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="blogpost-detail__title">Preums</h1>', html=True
        )
        self.assertContains(response, "Comte de Saint-Germain", html=True)

        self.assertContains(
            response,
            (
                '<a class="category-plugin-tag category-plugin-tag--draft" '
                'href="{:s}"><div class="category-plugin-tag__title">{:s}</div></a>'
            ).format(
                category.extended_object.get_absolute_url(),
                category.extended_object.get_title(),
            ),
            html=True,
        )
