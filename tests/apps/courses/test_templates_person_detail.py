"""
End-to-end tests for the person detail view
"""
import re

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_plugins import CategoryPlugin, OrganizationPlugin
from richie.apps.courses.factories import (
    BlogPostFactory,
    CategoryFactory,
    CourseFactory,
    OrganizationFactory,
    PersonFactory,
)


class PersonCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the person detail view
    """

    def test_templates_person_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published person page
        """
        # Categories
        published_category = CategoryFactory(should_publish=True)
        unpublished_category = CategoryFactory(should_publish=True)
        unpublished_category.extended_object.unpublish("en")
        extra_published_category = CategoryFactory(should_publish=True)
        not_published_category = CategoryFactory()

        # Modify the draft version of the published category
        title_obj = published_category.extended_object.title_set.get(language="en")
        title_obj.title = "modified title"
        title_obj.save()

        # Organizations
        published_organization = OrganizationFactory(should_publish=True)
        unpublished_organization = OrganizationFactory(should_publish=True)
        unpublished_organization.extended_object.unpublish("en")
        extra_published_organization = OrganizationFactory(should_publish=True)
        not_published_organization = OrganizationFactory()

        # Modify the draft version of the published organization
        title_obj = published_organization.extended_object.title_set.get(language="en")
        title_obj.title = "modified title"
        title_obj.save()

        person = PersonFactory(
            page_title="My page title",
            fill_portrait=True,
            fill_bio=True,
            fill_categories=[
                published_category,
                not_published_category,
                unpublished_category,
            ],
            fill_organizations=[
                published_organization,
                not_published_organization,
                unpublished_organization,
            ],
        )
        page = person.extended_object

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish the person
        page.publish("en")

        # Add a new category to the draft person page but don't publish the modification
        add_plugin(
            page.placeholders.get(slot="categories"),
            CategoryPlugin,
            "en",
            page=extra_published_category.extended_object,
        )

        # Add a new organization to the draft person page but don't publish the modification
        add_plugin(
            page.placeholders.get(slot="organizations"),
            OrganizationPlugin,
            "en",
            page=extra_published_organization.extended_object,
        )

        # Ensure the published page content is correct
        response = self.client.get(url)
        self.assertContains(
            response, "<title>My page title</title>", html=True, status_code=200
        )
        self.assertContains(
            response,
            '<h1 class="person-detail__card__content__title">{:s}</h1>'.format(
                person.extended_object.get_title()
            ),
            html=True,
        )
        # The published category should be on the page in its published version
        self.assertContains(
            response,
            (
                '<a class="category-plugin-tag" href="{:s}">'
                '<div class="category-plugin-tag__title">{:s}</div></a>'
            ).format(
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
        # - not_published category
        self.assertNotContains(
            response, not_published_category.extended_object.get_title(), html=True
        )
        # - unpublished category
        self.assertNotContains(
            response, unpublished_category.extended_object.get_title(), html=True
        )

        # The published organization should be on the page in its published version
        self.assertContains(
            response,
            '<div class="organization-glimpse__title">{:s}</div>'.format(
                published_organization.public_extension.extended_object.get_title()
            ),
            html=True,
        )

        # The other organizations should not be leaked:
        # - new organization linked only on the draft person page
        self.assertNotContains(
            response,
            extra_published_organization.extended_object.get_title(),
            html=True,
        )
        # - not published organization
        self.assertNotContains(
            response, not_published_organization.extended_object.get_title(), html=True
        )
        # - unpublished organization
        self.assertNotContains(
            response, unpublished_organization.extended_object.get_title(), html=True
        )

        # Modified draft category and organization should not be leaked
        self.assertNotContains(response, "modified")

    def test_templates_person_detail_cms_draft_content(self):
        """
        A superuser should see a draft person including its draft elements with an
        annotation.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        published_category = CategoryFactory(should_publish=True)
        not_published_category = CategoryFactory()

        published_organization = OrganizationFactory(should_publish=True)
        not_published_organization = OrganizationFactory()

        person = PersonFactory(
            page_title="My page title",
            fill_portrait=True,
            fill_bio=True,
            fill_categories=[published_category, not_published_category],
            fill_organizations=[published_organization, not_published_organization],
        )

        # Modify the draft version of the published category
        title_obj = published_category.extended_object.title_set.get(language="en")
        title_obj.title = "modified category"
        title_obj.save()

        # Modify the draft version of the published organization
        title_obj = published_category.extended_object.title_set.get(language="en")
        title_obj.title = "modified organization"
        title_obj.save()
        page = person.extended_object

        # The page should be visible as draft to the superuser
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>My page title</title>", html=True, status_code=200
        )
        title = person.extended_object.get_title()
        self.assertContains(
            response,
            f'<h1 class="person-detail__card__content__title">{title:s}</h1>',
            html=True,
        )

        # The published category should be on the page in its published version
        self.assertContains(
            response,
            (
                '<a class="category-plugin-tag" href="{:s}">'
                '<div class="category-plugin-tag__title">{:s}</div></a>'
            ).format(
                published_category.public_extension.extended_object.get_absolute_url(),
                published_category.public_extension.extended_object.get_title(),
            ),
            html=True,
        )
        # The not published category should be on the page, mark as draft
        self.assertContains(
            response,
            (
                '<a class="category-plugin-tag category-plugin-tag--draft" '
                'href="{:s}"><div class="category-plugin-tag__title">{:s}</div></a>'
            ).format(
                not_published_category.extended_object.get_absolute_url(),
                not_published_category.extended_object.get_title(),
            ),
            html=True,
        )

        # The published organization should be on the page in its published version
        self.assertContains(
            response,
            '<div class="organization-glimpse__title">{:s}</div>'.format(
                published_organization.public_extension.extended_object.get_title()
            ),
            html=True,
        )

        # The not published organization should be on the page, mark as draft
        self.assertContains(
            response,
            '<div class="organization-glimpse__title">{:s}</div>'.format(
                not_published_organization.extended_object.get_title()
            ),
            html=True,
        )
        self.assertIn(
            (
                '<a class=" organization-glimpse organization-glimpse--link '
                'organization-glimpse--draft " href="{url:s}">'
            ).format(url=not_published_organization.extended_object.get_absolute_url()),
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

        self.assertNotContains(response, "modified")

    def test_templates_person_detail_organizations_empty(self):
        """
        The "Organizations" section should not be displayed when empty.
        """
        person = PersonFactory(should_publish=True)

        # The "organizations" section should not be present on the public page
        url = person.public_extension.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(response, person.extended_object.get_title())
        self.assertNotContains(response, "organization")

        # But it should be present on the draft page
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(response, person.extended_object.get_title())
        self.assertContains(response, "organization-glimpse-list")

    def test_templates_person_detail_related_courses(self):
        """
        The courses to which a person has participated should appear on this person's detail page.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        person = PersonFactory()
        course = CourseFactory(fill_team=[person])

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)

        # The course should be present on the page
        self.assertContains(
            response,
            '<p class="course-glimpse__content__title">{:s}</p>'.format(
                course.extended_object.get_title()
            ),
            html=True,
        )

    def test_templates_person_detail_related_blog_posts(self):
        """
        The blog posts written by a person should appear on this person's detail page.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        person = PersonFactory()
        blog_post = BlogPostFactory(fill_author=[person])

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)

        # The blog post should be present on the page
        self.assertContains(
            response,
            '<p class="blogpost-glimpse__content__title">{:s}</p>'.format(
                blog_post.extended_object.get_title()
            ),
            html=True,
        )
