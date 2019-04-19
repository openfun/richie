"""
End-to-end tests for the person detail view
"""
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.factories import CategoryFactory, PersonFactory


class PersonCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the person detail view
    """

    def test_templates_person_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published person page
        """
        published_category, extra_published_category = CategoryFactory.create_batch(
            2, should_publish=True
        )
        unpublished_category = CategoryFactory()

        # Then modify its draft version
        title_obj = published_category.extended_object.title_set.get(language="en")
        title_obj.title = "modified title"
        title_obj.save()

        person = PersonFactory(
            page_title="My page title",
            fill_portrait=True,
            fill_resume=True,
            fill_categories=[published_category, unpublished_category],
        )
        page = person.extended_object

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish the person
        page.publish("en")

        # Add a new category to the draft person page but don't publish the modification
        placeholder = page.placeholders.get(slot="categories")
        add_plugin(
            placeholder,
            CategoryPlugin,
            "en",
            page=extra_published_category.extended_object,
        )

        # Ensure the published page content is correct
        response = self.client.get(url)
        self.assertContains(
            response, "<title>My page title</title>", html=True, status_code=200
        )
        full_name = person.get_full_name()
        self.assertContains(
            response, f'<h1 class="person-detail__title">{full_name:s}</h1>', html=True
        )
        # The published category should be on the page in its published version
        self.assertContains(
            response,
            '<a class="category-plugin-tag" href="{:s}">{:s}</a>'.format(
                published_category.public_extension.extended_object.get_absolute_url(),
                published_category.public_extension.extended_object.get_title(),
            ),
            html=True,
        )
        # The other categories should not be leaked:
        # - new_category linked only on the draft person page
        self.assertNotContains(
            response, extra_published_category.extended_object.get_title(), html=True
        )
        # - unpublished category
        self.assertNotContains(
            response, unpublished_category.extended_object.get_title(), html=True
        )
        # - modified draft version of the published category
        self.assertNotContains(response, "modified title")

    def test_templates_person_detail_cms_draft_content(self):
        """
        A superuser should see a draft person including its draft elements with an
        annotation.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        published_category = CategoryFactory(should_publish=True)
        unpublished_category = CategoryFactory()

        # Then modify its draft version
        title_obj = published_category.extended_object.title_set.get(language="en")
        title_obj.title = "modified title"
        title_obj.save()

        person = PersonFactory(
            page_title="My page title",
            fill_portrait=True,
            fill_resume=True,
            fill_categories=[published_category, unpublished_category],
        )
        page = person.extended_object

        # The page should be visible as draft to the superuser
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>My page title</title>", html=True, status_code=200
        )
        full_name = person.get_full_name()
        self.assertContains(
            response, f'<h1 class="person-detail__title">{full_name:s}</h1>', html=True
        )
        # The published category should be on the page in its published version
        self.assertContains(
            response,
            '<a class="category-plugin-tag" href="{:s}">{:s}</a>'.format(
                published_category.public_extension.extended_object.get_absolute_url(),
                published_category.public_extension.extended_object.get_title(),
            ),
            html=True,
        )
        # The unpublished category should be on the page, mark as draft
        self.assertContains(
            response,
            (
                '<a class="category-plugin-tag category-plugin-tag--draft" '
                'href="{:s}">{:s}</a>'
            ).format(
                unpublished_category.extended_object.get_absolute_url(),
                unpublished_category.extended_object.get_title(),
            ),
            html=True,
        )
        # The modified draft version of the published category should not be visible
        self.assertNotContains(response, "modified title")
