"""
End-to-end tests for the blogpost detail view
"""
import re
from datetime import datetime
from unittest import mock

from django.utils import timezone

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.factories import (
    BlogPostFactory,
    CategoryFactory,
    PersonFactory,
)


class DetailBlogPostCMSTestCase(CMSTestCase):
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

        # Publish the blogpost with a past date and ensure the content is correct
        with mock.patch(
            "cms.models.pagemodel.now",
            return_value=datetime(2019, 11, 27, tzinfo=timezone.utc),
        ):
            page.publish("en")

        response = self.client.get(url)

        self.assertContains(
            response, "<title>Preums</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="blogpost-detail__title">Preums</h1>', html=True
        )
        self.assertNotContains(response, "Comte de Saint-Germain", html=True)

        self.assertContains(
            response,
            '<p class="blogpost-detail__pubdate">11/27/2019</p>',
            html=True,
        )

    def test_templates_blogpost_detail_cms_draft_content(self):
        """
        A staff user should see a draft blogpost including only its published linked objects.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        category = CategoryFactory()
        published_category = CategoryFactory(should_publish=True)
        author = PersonFactory(
            page_title={"en": "Comte de Saint-Germain"}, should_publish=True
        )

        blogpost = BlogPostFactory(
            page_title="Preums",
            fill_cover=True,
            fill_body=True,
            fill_categories=[category, published_category],
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
                # pylint: disable=consider-using-f-string
                '<a class="category-tag" '
                'href="{:s}"><span class="category-tag__title">{:s}</span></a>'
            ).format(
                published_category.extended_object.get_absolute_url(),
                published_category.extended_object.get_title(),
            ),
            html=True,
        )
        self.assertContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                '<a class="category-tag category-tag--draft" '
                'href="{:s}"><span class="category-tag__title">{:s}</span></a>'
            ).format(
                category.extended_object.get_absolute_url(),
                category.extended_object.get_title(),
            ),
            html=True,
        )
        self.assertContains(
            response,
            '<p class="blogpost-detail__pubdate">Not published yet</p>',
            html=True,
        )

    def test_templates_blogpost_detail_cms_published_content_opengraph(self):
        """The blogpost logo should be used as opengraph image."""
        blogpost = BlogPostFactory(
            fill_cover={
                "original_filename": "cover.jpg",
                "default_alt_text": "my cover",
            },
            should_publish=True,
        )
        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, '<meta property="og:type" content="article" />')
        self.assertContains(
            response, f'<meta property="og:url" content="http://example.com{url:s}" />'
        )
        pattern = (
            r'<meta property="og:image" content="http://example.com'
            r"/media/filer_public_thumbnails/filer_public/.*cover\.jpg__845x500"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertContains(
            response, '<meta property="og:image:width" content="845" />'
        )
        self.assertContains(
            response, '<meta property="og:image:height" content="500" />'
        )
