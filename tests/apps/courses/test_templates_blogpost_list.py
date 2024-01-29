"""
End-to-end tests for the blogpost list view
"""

from datetime import timedelta
from unittest import mock

from django.utils import timezone

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.courses.factories import BlogPostFactory, CategoryFactory


class ListBlogPostCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the blogpost list view
    """

    def test_templates_blogpost_list_cms_content(self):
        """
        Validate that the public website only displays blogposts that are currently published,
        while staff users can see draft and unpublished blogposts.
        """
        page = PageFactory(
            template="courses/cms/blogpost_list.html",
            title__language="en",
            should_publish=True,
        )

        BlogPostFactory(page_parent=page, page_title="First post")
        BlogPostFactory(page_parent=page, page_title="Second post", should_publish=True)

        # Publish with a publication date in the future
        future = timezone.now() + timedelta(hours=1)
        with mock.patch("cms.models.pagemodel.now", return_value=future):
            BlogPostFactory(
                page_parent=page, page_title="Third post", should_publish=True
            )

        # Anonymous users should only see published blogposts
        response = self.client.get(page.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "First")
        self.assertContains(response, "Second")
        self.assertNotContains(response, "Third")

        # Staff users can see draft and unpublished blogposts
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        response = self.client.get(page.get_absolute_url())
        self.assertEqual(response.status_code, 200)

        for title in ["First", "Second", "Third"]:
            self.assertContains(response, title)

    def test_templates_blogpost_list_related_categories(self):
        """
        The top of the page should list all categories related to at least one of the blog
        posts on the blog posts list page.
        """
        page = PageFactory(
            template="courses/cms/blogpost_list.html",
            title__language="en",
            should_publish=True,
        )

        post1, post2 = BlogPostFactory.create_batch(
            2, page_parent=page, should_publish=True
        )

        category1, category2, category12, category_alone = CategoryFactory.create_batch(
            4, should_publish=True
        )

        # Attach categories to post1
        placeholder = post1.extended_object.get_public_object().placeholders.all()[0]
        add_plugin(placeholder, "CategoryPlugin", "en", page=category1.extended_object)
        add_plugin(placeholder, "CategoryPlugin", "en", page=category12.extended_object)

        # Attach categories to post2
        placeholder = post2.extended_object.get_public_object().placeholders.all()[0]
        add_plugin(placeholder, "CategoryPlugin", "en", page=category2.extended_object)
        add_plugin(placeholder, "CategoryPlugin", "en", page=category12.extended_object)

        response = self.client.get(page.get_absolute_url())
        self.assertEqual(response.status_code, 200)

        for category in [category1, category2, category12]:
            slug = category.extended_object.get_absolute_url()
            title = category.extended_object.get_title()
            self.assertContains(
                response,
                (
                    f'<a class="category-tag" href="{slug:s}">'
                    f'<span class="category-tag__title">{title:s}</span>'
                    "</a>"
                ),
                html=True,
            )

        self.assertNotContains(
            response, category_alone.extended_object.get_absolute_url()
        )
