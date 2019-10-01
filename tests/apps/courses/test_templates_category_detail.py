"""
End-to-end tests for the category detail view
"""
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
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
            '<p class="course-glimpse__content__title">{:s}</p>',
        )

    def test_templates_category_detail_cms_published_content_blogposts(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related blogposts in all publication states.
        """
        self._extension_cms_published_content(
            BlogPostFactory,
            "categories",
            '<p class="blogpost-glimpse__content__title">{:s}</p>',
        )

    def test_templates_category_detail_cms_published_content_persons(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related persons in all publication states.
        """
        self._extension_cms_published_content(
            PersonFactory,
            "categories",
            '<h2 class="person-glimpse__content__wrapper__title">{:s}</h2>',
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
            CourseFactory, '<p class="course-glimpse__content__title">{:s}</p>'
        )

    def test_templates_category_detail_cms_draft_content_blogposts(self):
        """Validate how a draft category page is displayed with its related blogposts."""
        self._extension_cms_draft_content(
            BlogPostFactory, '<p class="blogpost-glimpse__content__title">{:s}</p>'
        )

    def test_templates_category_detail_cms_draft_content_persons(self):
        """Validate how a draft category page is displayed with its related persons."""
        self._extension_cms_draft_content(
            PersonFactory,
            '<h2 class="person-glimpse__content__wrapper__title">{:s}</h2>',
        )
