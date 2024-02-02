"""Test suite for the GetRelatedCategories template tag."""

from django.test import RequestFactory

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory
from richie.apps.courses.factories import CategoryFactory


class GetRelatedCategoriesTemplateTagsTestCase(CMSTestCase):
    """
    Integration tests to validate the behavior of the `get_related_category_pages` template tag.
    """

    @staticmethod
    def _attach_categories(page, category_page_draft, category_page_published):
        """
        Not a test. Utility method to easily create and attach a draft and a published
        category to a page passed as argument;
        """
        placeholder = page.placeholders.all()[0]
        add_plugin(placeholder, "CategoryPlugin", "en", page=category_page_draft)
        add_plugin(placeholder, "CategoryPlugin", "en", page=category_page_published)

    # pylint: disable=too-many-locals
    def test_templatetags_get_related_category_pages_draft(self):
        """
        On a draft page, the "get_related_category_pages" template tag should inject in the
        context, all categories related to a queryset of pages via a CategoryPlugin.
        """
        page_main = PageFactory(
            template="richie/single_column.html", should_publish=True
        )
        page1, page2 = PageFactory.create_batch(
            2, template="richie/single_column.html", should_publish=True
        )

        (
            category_draft_page1_draft,
            category_draft_page1_published,
            category_draft_page2_draft,
            category_draft_page2_published,
        ) = [c.extended_object for c in CategoryFactory.create_batch(4)]

        (
            category_published_page1_draft,
            category_published_page1_published,
            category_published_page2_draft,
            category_published_page2_published,
        ) = [
            c.extended_object
            for c in CategoryFactory.create_batch(4, should_publish=True)
        ]

        self._attach_categories(
            page1, category_draft_page1_draft, category_published_page1_draft
        )
        self._attach_categories(
            page1.get_public_object(),
            category_draft_page1_published,
            category_published_page1_published,
        )
        self._attach_categories(
            page2, category_draft_page2_draft, category_published_page2_draft
        )
        self._attach_categories(
            page2.get_public_object(),
            category_draft_page2_published,
            category_published_page2_published,
        )

        request = RequestFactory().get("/")
        template = (
            "{% load cms_tags category_tags %}"
            "{% get_related_category_pages pages as categories %}"
            "{% for category in categories %}{{ category.extended_object.id }}{% endfor %}"
        )

        # 1. Test categories present on the draft page

        # - Linked with one of the pages
        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template, {"current_page": page_main, "pages": [page1]}, request
            )
        expected = [category_draft_page1_draft, category_published_page1_draft]
        self.assertEqual(output, "".join([str(c.id) for c in expected]))

        # - Linked with either of the 2 pages
        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template, {"current_page": page_main, "pages": [page1, page2]}, request
            )
        expected = [
            category_draft_page1_draft,
            category_draft_page2_draft,
            category_published_page1_draft,
            category_published_page2_draft,
        ]
        self.assertEqual(output, "".join([str(c.id) for c in expected]))

        # - Linked with a page in a different publication status
        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template,
                {"current_page": page_main, "pages": [page1.get_public_object()]},
                request,
            )
        expected = [category_draft_page1_draft, category_published_page1_draft]
        self.assertEqual(output, "")

        # 2. Test categories on the public page
        current_page = page_main.get_public_object()

        # - Linked with one of the pages
        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template,
                {"current_page": current_page, "pages": [page1.get_public_object()]},
                request,
            )
        self.assertEqual(
            output, str(category_published_page1_published.get_public_object().id)
        )

        # - Linked with either of the 2 pages
        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template,
                {
                    "current_page": current_page,
                    "pages": [page1.get_public_object(), page2.get_public_object()],
                },
                request,
            )
        expected = [
            category_published_page1_published.get_public_object(),
            category_published_page2_published.get_public_object(),
        ]
        self.assertEqual(output, "".join([str(c.id) for c in expected]))

        # - Linked with a page in a different publication status
        with self.assertNumQueries(2):
            output = self.render_template_obj(
                template,
                {"current_page": current_page, "pages": [page1]},
                request,
            )
        self.assertEqual(output, "")
