"""
End-to-end tests for the category detail view
"""
from unittest import mock

from django.test.utils import override_settings

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.factories import (
    BlogPostFactory,
    CategoryFactory,
    CourseFactory,
    OrganizationFactory,
    PersonFactory,
)


class CategoryCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the category detail view
    """

    def _extension_cms_published_content(
        self, factory_model, placeholder_slot, control_string
    ):
        """
        Not a test. Sharing code for related page extension tests.
        Validate that the important elements are displayed on a published category page and check
        related page extensions in all publication states.
        """
        category = CategoryFactory(page_title="Maths")
        page = category.extended_object

        # Related page extensions
        published_extension = factory_model(
            fill_categories=[category], should_publish=True
        )
        extra_published_extension = factory_model(should_publish=True)
        unpublished_extension = factory_model(
            fill_categories=[category], should_publish=True
        )
        unpublished_extension.extended_object.unpublish("en")
        not_published_extension = factory_model(fill_categories=[category])

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish the category
        page.publish("en")

        # Modify the draft version of the published extension
        title_obj = published_extension.extended_object.title_set.get(language="en")
        title_obj.title = "modified extension"
        title_obj.save()

        # Add an extra extension to the draft category page but don't publish the modification
        add_plugin(
            extra_published_extension.extended_object.placeholders.get(
                slot=placeholder_slot
            ),
            CategoryPlugin,
            "en",
            page=category.extended_object,
        )

        # Ensure the published page content is correct
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Maths</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="category-detail__title">Maths</h1>', html=True
        )

        # The published extension should be on the page in its published version
        self.assertContains(
            response,
            control_string.format(
                published_extension.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        # The other extensions should not be leaked:
        # - extra extension linked only on the draft category page
        self.assertNotContains(
            response, extra_published_extension.extended_object.get_title()
        )
        # - not published extension
        self.assertNotContains(
            response, not_published_extension.extended_object.get_title()
        )
        # - unpublished extension
        self.assertNotContains(
            response, unpublished_extension.extended_object.get_title()
        )

        # Modified draft extension should not be leaked
        self.assertNotContains(response, "modified")

    def test_templates_category_detail_cms_published_content_organizations(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related organizations in all publication states.
        """
        self._extension_cms_published_content(
            OrganizationFactory,
            "categories",
            '<div class="organization-glimpse__title">{:s}</div>',
        )

    def test_templates_category_detail_cms_published_content_courses(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related courses in all publication states.
        """
        self._extension_cms_published_content(
            CourseFactory,
            "course_categories",
            '<p class="course-glimpse__title">{:s}</p>',
        )

    @mock.patch(
        "cms.templatetags.cms_tags.PageUrl.get_value", return_value="/the/courses/"
    )
    @override_settings(RICHIE_GLIMPSE_PAGINATION={"courses": 2})
    def test_templates_category_detail_cms_published_content_max_courses(
        self, _mock_page_url
    ):
        """
        Make sure the category detail page does not display too many courses, even when a large
        number are related to the current category, as this can cause the page to load very slowly
        and is not a great experience for the user anyway.
        """
        # Create our dummy category and the 3 courses we'll attach to it
        meta = CategoryFactory(
            page_parent=create_i18n_page(
                {"en": "Categories", "fr": "Catégories"}, published=True
            ),
            page_reverse_id="subjects",
            page_title={"en": "Subjects", "fr": "Sujets"},
            should_publish=True,
        )
        category = CategoryFactory(
            page_parent=meta.extended_object, should_publish=True
        )
        courses = CourseFactory.create_batch(
            3, fill_categories=[category], should_publish=True
        )
        # Link the 3 courses with our category through the relevant placeholder
        for course in courses:
            add_plugin(
                course.extended_object.placeholders.get(slot="course_categories"),
                CategoryPlugin,
                "en",
                page=category.extended_object,
            )
        # Make sure we do have 3 courses on the category
        self.assertEqual(category.get_courses().count(), 3)

        # Only the first two are rendered in the template
        response = self.client.get(category.extended_object.get_absolute_url())
        self.assertContains(response, courses[0].extended_object.get_title())
        self.assertContains(response, courses[1].extended_object.get_title())
        self.assertNotContains(response, courses[2].extended_object.get_title())

        # There is a link to view more related courses directly in the Search view
        self.assertContains(
            response, f'href="/the/courses/?subjects={category.get_es_id():s}"'
        )
        self.assertContains(
            response,
            f"See all courses related to {category.extended_object.get_title():s}",
        )

    @mock.patch(
        "cms.templatetags.cms_tags.PageUrl.get_value", return_value="/the/courses/"
    )
    @override_settings(RICHIE_GLIMPSE_PAGINATION={"courses": 2})
    def test_templates_category_detail_cms_published_content_max_courses_on_meta(
        self, _mock_page_url
    ):
        """
        Meta categories are a special case: technically, any page linked to one of their children
        is linked to the meta-category too. This means in a lot of cases we just want a link to
        *all* courses not just their related courses.
        The Search view is also not equipped to filter on a meta-category. In this case, we just
        link to it with a different link text.
        """
        # Create our dummy category and the 3 courses we'll attach to it
        meta = CategoryFactory(
            page_parent=create_i18n_page(
                {"en": "Categories", "fr": "Catégories"}, published=True
            ),
            page_reverse_id="subjects",
            page_title={"en": "Subjects", "fr": "Sujets"},
            should_publish=True,
        )
        category = CategoryFactory(
            page_parent=meta.extended_object, should_publish=True
        )
        courses = CourseFactory.create_batch(
            3, fill_categories=[category], should_publish=True
        )
        # Link the 3 courses with our category through the relevant placeholder
        for course in courses:
            add_plugin(
                course.extended_object.placeholders.get(slot="course_categories"),
                CategoryPlugin,
                "en",
                page=category.extended_object,
            )
        # Make sure we do have 3 courses on the category
        self.assertEqual(category.get_courses().count(), 3)

        # NB: here we are requesting the meta category's page, not the child category
        # Only the first two are rendered in the template
        response = self.client.get(meta.extended_object.get_absolute_url())
        self.assertContains(response, courses[0].extended_object.get_title())
        self.assertContains(response, courses[1].extended_object.get_title())
        self.assertNotContains(response, courses[2].extended_object.get_title())

        # There is a link to view all courses
        self.assertContains(response, 'href="/the/courses/')
        self.assertContains(response, "See all courses")

    def test_templates_category_detail_cms_published_content_blogposts(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related blogposts in all publication states.
        """
        self._extension_cms_published_content(
            BlogPostFactory,
            "categories",
            '<p class="blogpost-glimpse__title">{:s}</p>',
        )

    def test_templates_category_detail_cms_published_content_persons(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related persons in all publication states.
        """
        self._extension_cms_published_content(
            PersonFactory, "categories", '<h2 class="person-glimpse__title">{:s}</h2>',
        )

    def _extension_cms_draft_content(self, factory_model, control_string):
        """
        Not a test. Sharing code for related page extension tests.
        Validate how a draft category is displayed with its related page extensions.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        category = CategoryFactory(page_title="Maths")
        page = category.extended_object

        # Organizations
        published_extension = factory_model(
            fill_categories=[category], should_publish=True
        )
        not_published_extension = factory_model(fill_categories=[category])

        # Modify the draft version of the published page extension
        title_obj = published_extension.extended_object.title_set.get(language="en")
        title_obj.title = "modified extension"
        title_obj.save()

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>Maths</title>", html=True, status_code=200
        )
        self.assertContains(
            response, '<h1 class="category-detail__title">Maths</h1>', html=True
        )

        # The published page extension should be on the page in its published version
        self.assertContains(
            response,
            control_string.format(published_extension.extended_object.get_title()),
            html=True,
        )
        # The not published page extension should be on the page, mark as draft
        self.assertContains(
            response,
            control_string.format(not_published_extension.extended_object.get_title()),
            html=True,
        )

    def test_templates_category_detail_cms_draft_content_organizations(self):
        """Validate how a draft category page is displayed with its related organizations."""
        self._extension_cms_draft_content(
            OrganizationFactory, '<div class="organization-glimpse__title">{:s}</div>'
        )

    def test_templates_category_detail_cms_draft_content_courses(self):
        """Validate how a draft category page is displayed with its related courses."""
        self._extension_cms_draft_content(
            CourseFactory, '<p class="course-glimpse__title">{:s}</p>'
        )

    def test_templates_category_detail_cms_draft_content_blogposts(self):
        """Validate how a draft category page is displayed with its related blogposts."""
        self._extension_cms_draft_content(
            BlogPostFactory, '<p class="blogpost-glimpse__title">{:s}</p>'
        )

    def test_templates_category_detail_cms_draft_content_persons(self):
        """Validate how a draft category page is displayed with its related persons."""
        self._extension_cms_draft_content(
            PersonFactory, '<h2 class="person-glimpse__title">{:s}</h2>',
        )
