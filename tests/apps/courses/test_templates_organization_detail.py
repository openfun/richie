"""
End-to-end tests for the organization detail view
"""
import re

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import UserFactory
from richie.apps.courses.cms_plugins import CategoryPlugin, OrganizationPlugin
from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    OrganizationFactory,
    PersonFactory,
)


class OrganizationCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the organization detail view
    """

    def test_templates_organization_detail_cms_published_content(self):
        """
        Validate that the important elements are displayed on a published organization page
        """
        # Categories
        published_category = CategoryFactory(should_publish=True)
        extra_published_category = CategoryFactory(should_publish=True)
        unpublished_category = CategoryFactory(should_publish=True)
        unpublished_category.extended_object.unpublish("en")
        not_published_category = CategoryFactory()

        # Organizations
        organization = OrganizationFactory(
            page_title="La Sorbonne",
            fill_categories=[
                published_category,
                not_published_category,
                unpublished_category,
            ],
        )

        # Courses
        published_course = CourseFactory(
            fill_organizations=[organization], should_publish=True
        )
        extra_published_course = CourseFactory(should_publish=True)
        unpublished_course = CourseFactory(fill_organizations=[organization])
        not_published_course = CourseFactory(fill_organizations=[organization])

        # Republish courses to take into account adding the organization
        published_course.extended_object.publish("en")
        unpublished_course.extended_object.publish("en")
        unpublished_course.extended_object.unpublish("en")

        page = organization.extended_object

        # The page should not be visible before it is published
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

        # Publish the organization
        page.publish("en")

        # Modify the draft version of the published category
        title_obj = published_category.extended_object.title_set.get(language="en")
        title_obj.title = "modified category"
        title_obj.save()

        # Modify the draft version of the published course
        title_obj = published_course.extended_object.title_set.get(language="en")
        title_obj.title = "modified course"
        title_obj.save()

        # Add a new category to the draft organization page but don't publish the modification
        add_plugin(
            page.placeholders.get(slot="categories"),
            CategoryPlugin,
            "en",
            page=extra_published_category.extended_object,
        )

        # Add a new organization to the draft course page but don't publish the modification
        add_plugin(
            extra_published_course.extended_object.placeholders.get(
                slot="course_organizations"
            ),
            OrganizationPlugin,
            "en",
            page=page,
        )

        # Ensure the published page content is correct
        response = self.client.get(url)
        self.assertContains(
            response, "<title>La Sorbonne</title>", html=True, status_code=200
        )
        self.assertContains(
            response,
            '<h1 class="organization-detail__title">La Sorbonne</h1>',
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
        # - new_category linked only on the draft organization page
        self.assertNotContains(
            response, extra_published_category.extended_object.get_title()
        )
        # - not published category
        self.assertNotContains(
            response, not_published_category.extended_object.get_title()
        )
        # - unpublished category
        self.assertNotContains(
            response, unpublished_category.extended_object.get_title()
        )

        # The published courses should be on the page in its published version
        self.assertContains(
            response,
            '<p class="course-glimpse__content__title">{:s}</p>'.format(
                published_course.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        # The other courses should not be leaked:
        # - new course linked only on the draft organization page
        self.assertNotContains(
            response, extra_published_course.extended_object.get_title()
        )
        # - not published course
        self.assertNotContains(
            response, not_published_course.extended_object.get_title()
        )
        # - unpublished course
        self.assertNotContains(response, unpublished_course.extended_object.get_title())

        # Modified draft category and course should not be leaked
        self.assertNotContains(response, "modified")

    def test_templates_organization_detail_cms_draft_content(self):
        """
        A staff user should see a draft organization including its draft elements with an
        annotation.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        published_category = CategoryFactory(should_publish=True)
        not_published_category = CategoryFactory()

        organization = OrganizationFactory(
            page_title="La Sorbonne",
            fill_categories=[published_category, not_published_category],
        )

        published_course = CourseFactory(
            fill_organizations=[organization], should_publish=True
        )
        not_published_course = CourseFactory(fill_organizations=[organization])

        # Republish courses to take into account adding the organization
        published_course.extended_object.publish("en")

        # Modify the draft version of the published category
        title_obj = published_category.extended_object.title_set.get(language="en")
        title_obj.title = "modified category"
        title_obj.save()

        # Modify the draft version of the published course
        title_obj = published_course.extended_object.title_set.get(language="en")
        title_obj.title = "modified course"
        title_obj.save()

        page = organization.extended_object

        # The page should be visible as draft to the staff user
        url = page.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(
            response, "<title>La Sorbonne</title>", html=True, status_code=200
        )
        self.assertContains(
            response,
            '<h1 class="organization-detail__title">La Sorbonne</h1>',
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
        # The modified draft category should not be leaked
        self.assertNotContains(response, "modified category")

        # The published course should be on the page in its draft version
        self.assertContains(
            response,
            '<p class="course-glimpse__content__title">modified course</p>',
            html=True,
        )

        # The not published course should be on the page, mark as draft
        self.assertContains(
            response,
            '<p class="course-glimpse__content__title">{:s}</p>'.format(
                not_published_course.extended_object.get_title()
            ),
            html=True,
        )
        self.assertIn(
            '<a class=" course-glimpse course-glimpse--link course-glimpse--draft " '
            'href="{:s}"'.format(
                not_published_course.extended_object.get_absolute_url()
            ),
            re.sub(" +", " ", str(response.content).replace("\\n", "")),
        )

    def test_templates_organization_detail_related_persons(self):
        """
        Persons related to an organization via a plugin should appear on the organization
        detail page.
        """
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        organization = OrganizationFactory()
        person = PersonFactory(fill_organizations=[organization])
        page = organization.extended_object

        url = page.get_absolute_url()
        response = self.client.get(url)

        # The person should be present on the page
        pattern = (
            r'<a href="{url:s}">'
            r'<h2 class="person-glimpse__content__wrapper__title">'
            r".*{name:s}.*</h2></a>"
        ).format(
            url=person.extended_object.get_absolute_url(),
            name=person.extended_object.get_title(),
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
