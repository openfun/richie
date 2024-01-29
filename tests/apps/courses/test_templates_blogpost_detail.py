"""
End-to-end tests for the blogpost detail view
"""

import re
from datetime import datetime
from unittest import mock

from django.utils import timezone

from cms.api import add_plugin
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

    def test_templates_blogpost_detail_open_graph_description_excerpt(self):
        """
        An opengraph description meta should be present if the excerpt placeholder is set.
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object

        # Add an excerpt to the blogpost
        placeholder = blogpost.extended_object.placeholders.get(slot="excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A further sub title of the blog post",
        )
        page.publish("en")

        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta property="og:description" content="A further sub title of the blog post" />',
        )

    def test_templates_blogpost_detail_open_graph_description_excerpt_max_length(self):
        """
        An opengraph description should be cut if it exceeds more than 200 caracters
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. " * 5
        )

        # Add an excerpt to the blogpost
        placeholder = blogpost.extended_object.placeholders.get(slot="excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:200]
        self.assertContains(
            response,
            f'<meta property="og:description" content="{cut}" />',
        )

    def test_templates_blogpost_detail_open_graph_description_excerpt_empty(self):
        """
        The opengraph description meta should be missing if the excerpt placeholder is not set.
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object
        page.publish("en")

        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            "og:description",
        )

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
            response, "<title>Preums - example.com</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="blogpost-detail__title">Preums</h1>', html=True
        )
        self.assertContains(response, "Comte de Saint-Germain", html=True)

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
            response, "<title>Preums - example.com</title>", html=True, status_code=200
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

    def test_templates_blogpost_detail_author_empty(self):
        """
        The empty message for blogpost author should be present in edition but not in
        published mode if its placeholder is empty.
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object
        page.publish("en")

        url = page.get_absolute_url()
        response = self.client.get(url)

        # Published view does not have empty author message
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(
            response,
            ('<span class="blogpost-detail__empty">No author yet</span>'),
            html=True,
        )

        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")
        response = self.client.get(url, {"edit": "true"})

        # Edition view does have empty author message
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            ('<span class="blogpost-detail__empty">No author yet</span>'),
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

    def test_templates_blogpost_detail_meta_description(self):
        """
        The blogpost meta description should show meta_description placeholder if defined
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object

        title_obj = page.get_title_obj(language="en")
        title_obj.meta_description = "A custom description of the blog post"
        title_obj.save()

        page.publish("en")

        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A custom description of the blog post" />',
        )

    def test_templates_blogpost_detail_meta_description_excerpt(self):
        """
        The blogpost meta description should show the excerpt placeholder if no meta_description
        placeholoder exists
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object

        # Add an excerpt to the blogpost
        placeholder = blogpost.extended_object.placeholders.get(slot="excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A further sub title of the blog post",
        )
        page.publish("en")

        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A further sub title of the blog post" />',
        )

    def test_templates_blogpost_detail_meta_description_excerpt_max_length(self):
        """
        The blogpost meta description should be cut if it exceeds more than 160 caracters
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
        )

        # Add an excerpt to the blogpost
        placeholder = blogpost.extended_object.placeholders.get(slot="excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:160]
        self.assertContains(
            response,
            f'<meta name="description" content="{cut}" />',
        )

    def test_templates_blogpost_detail_meta_description_empty(self):
        """
        The blogpost meta description should not be present if neither the meta_description field
        on the page, nor the excerpt placeholder are filled
        """
        blogpost = BlogPostFactory()
        page = blogpost.extended_object
        page.publish("en")

        url = blogpost.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            '<meta name="description"',
        )
