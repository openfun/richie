"""
End-to-end tests for the person detail view
"""

import re
from unittest import mock

from django.test.utils import override_settings

import htmlmin
import lxml.html
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.courses.cms_plugins import (
    CategoryPlugin,
    OrganizationPlugin,
    PersonPlugin,
)
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

    def test_templates_person_detail_open_graph_description_bio(self):
        """
        An opengraph description meta should be present if the person bio placeholder is set.
        """
        person = PersonFactory()
        page = person.extended_object

        # Add a bio to a person
        placeholder = person.extended_object.placeholders.get(slot="bio")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A biographic description of the person",
        )
        page.publish("en")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta property="og:description" content="A biographic description of the person" />',
        )

    def test_templates_person_detail_open_graph_description_bio_exceeds_max_length(
        self,
    ):
        """
        The open graph description should be cut if it exceeds more than 200 caracters
        """
        person = PersonFactory()
        page = person.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. " * 7
        )

        # Add a bio to a person
        placeholder = person.extended_object.placeholders.get(slot="bio")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:200]
        self.assertContains(
            response,
            f'<meta property="og:description" content="{cut}" />',
        )

    def test_templates_person_detail_open_graph_description_empty(self):
        """
        The opengraph description meta should not be present if person bio placeholder is not set
        """
        person = PersonFactory()
        page = person.extended_object
        page.publish("en")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            "og:description",
        )

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
            response,
            "<title>My page title - example.com</title>",
            html=True,
            status_code=200,
        )
        self.assertContains(
            response,
            f'<h1 class="subheader__title">{person.extended_object.get_title():s}</h1>',
            html=True,
        )
        # The published category should be on the page in its published version
        self.assertContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                '<a class="category-badge" href="{:s}">'
                '<span class="offscreen">Category</span>'
                '<span class="category-badge__title">{:s}</span></a>'
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
            # pylint: disable=consider-using-f-string
            '<h2 class="organization-glimpse__title" property="name">{:s}</h2>'.format(
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
            fill_maincontent=True,
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
        content = htmlmin.minify(
            response.content.decode("UTF-8"),
            reduce_empty_attributes=False,
            remove_optional_attribute_quotes=False,
        )

        self.assertContains(
            response,
            "<title>My page title - example.com</title>",
            html=True,
            status_code=200,
        )
        title = person.extended_object.get_title()
        self.assertContains(
            response,
            f'<h1 class="subheader__title">{title:s}</h1>',
            html=True,
        )

        # Main content should be present when not empty
        self.assertContains(response, "person-detail__maincontent")

        # The published category should be on the page in its published version
        self.assertContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                '<a class="category-badge" href="{:s}">'
                '<span class="offscreen">Category</span>'
                '<span class="category-badge__title">{:s}</span></a>'
            ).format(
                published_category.public_extension.extended_object.get_absolute_url(),
                published_category.public_extension.extended_object.get_title(),
            ),
            html=True,
        )
        # The not published category should not be on the page
        self.assertContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                '<a class="category-badge category-badge--draft" href="{:s}">'
                '<span class="offscreen">Category</span>'
                '<span class="category-badge__title">{:s}</span></a>'
            ).format(
                not_published_category.extended_object.get_absolute_url(),
                not_published_category.extended_object.get_title(),
            ),
            html=True,
        )

        # The published organization should be on the page in its published version
        self.assertIn(
            # pylint: disable=consider-using-f-string
            '<div class="organization-glimpse" property="contributor" '
            'typeof="CollegeOrUniversity"><a href="{:s}" title="{:s}">'.format(
                published_organization.extended_object.get_absolute_url(),
                published_organization.extended_object.get_title(),
            ),
            content,
        )
        self.assertContains(
            response,
            # pylint: disable=consider-using-f-string
            '<h2 class="organization-glimpse__title" property="name">{:s}</h2>'.format(
                published_organization.public_extension.extended_object.get_title()
            ),
            html=True,
        )
        # The not published organization should not be on the page
        self.assertIn(
            # pylint: disable=consider-using-f-string
            '<a href="{:s}" title="{:s}">'.format(
                not_published_organization.extended_object.get_absolute_url(),
                not_published_organization.extended_object.get_title(),
            ),
            content,
        )

        self.assertContains(
            response,
            # pylint: disable=consider-using-f-string
            '<h2 class="organization-glimpse__title" property="name">{:s}</h2>'.format(
                not_published_organization.extended_object.get_title()
            ),
            html=True,
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

    def test_templates_person_detail_maincontent_empty(self):
        """
        The "maincontent" placeholder block should not be displayed on the public
        page when empty but only on the draft version for staff.
        """
        person = PersonFactory(should_publish=True)

        # The "organizations" section should not be present on the public page
        url = person.public_extension.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(response, person.extended_object.get_title())
        self.assertNotContains(response, "person-detail__maincontent")

        # But it should be present on the draft page
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertContains(response, person.extended_object.get_title())
        self.assertContains(response, "person-detail__maincontent")

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
            '<span class="course-glimpse__title-text">{0:s}</span>'.format(  # noqa pylint: disable=consider-using-f-string,line-too-long
                course.extended_object.get_title()
            ),
            html=True,
        )

    @mock.patch(
        "cms.templatetags.cms_tags.PageUrl.get_value", return_value="/the/courses/"
    )
    @override_settings(RICHIE_GLIMPSE_PAGINATION={"courses": 2})
    def test_templates_person_detail_related_max_courses(self, _mock_page_url):
        """
        Make sure the person detail page does not display too many courses, even when a large
        number are related to the current person, as this can cause the page to load very slowly
        and is not a great experience for the user anyway.
        """
        # Create our dummy person and the 3 courses we'll attach to it
        person = PersonFactory(should_publish=True)
        courses = CourseFactory.create_batch(3, fill_team=[person], should_publish=True)
        # Link the 3 courses with our person through the relevant placeholder
        for course in courses:
            add_plugin(
                course.extended_object.placeholders.get(slot="course_team"),
                PersonPlugin,
                "en",
                page=person.extended_object,
            )
        # Make sure we do have 3 courses on the person
        self.assertEqual(person.get_courses().count(), 3)

        # Only the first two are rendered in the template
        response = self.client.get(person.extended_object.get_absolute_url())
        self.assertContains(response, courses[0].extended_object.get_title())
        self.assertContains(response, courses[1].extended_object.get_title())
        self.assertNotContains(response, courses[2].extended_object.get_title())

        # There is a link to view more related courses directly in the Search view
        self.assertContains(
            response,
            f'href="/the/courses/?persons={person.get_es_id()}"',
        )
        self.assertContains(
            response,
            f"See all courses related to {person.extended_object.get_title():s}",
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
        html = lxml.html.fromstring(response.content)

        # The blog post should be present on the page
        title = html.cssselect("h3.blogpost-glimpse__title")[0]
        self.assertEqual(
            title.text_content().strip(), blog_post.extended_object.get_title()
        )

    def test_template_person_detail_without_person(self):
        """
        A person template page without attached person should show an error banner
        explaining to the user that he/she is misusing the template.
        """
        page = PageFactory(
            template="courses/cms/person_detail.html",
            title__language="en",
            should_publish=True,
        )

        with self.assertTemplateUsed(
            "courses/cms/fragment_error_detail_template_banner.html"
        ):
            response = self.client.get(page.get_absolute_url())

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            (
                '<div class="banner banner--error banner--rounded" role="alert">'
                '<svg class="banner__icon" aria-hidden="true"><use href="#icon-cross" /></svg>'
                '<p class="banner__message">'
                "A person object is missing on this person page. "
                "Please select another page template."
                "<br />"
                "If what you need is a person page, you need to create it "
                'via the wizard and choose "New person page".'
                "</p>"
                "</div>"
            ),
            html=True,
        )

    def test_templates_person_detail_cms_published_content_opengraph(self):
        """The person logo should be used as opengraph image."""
        person = PersonFactory(
            fill_portrait={
                "original_filename": "portrait.jpg",
                "default_alt_text": "my portrait",
            },
            should_publish=True,
        )
        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, '<meta property="og:type" content="profile" />')
        self.assertContains(
            response, f'<meta property="og:url" content="http://example.com{url:s}" />'
        )
        pattern = (
            r'<meta property="og:image" content="http://example.com'
            r"/media/filer_public_thumbnails/filer_public/.*portrait\.jpg__200x200"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertContains(
            response, '<meta property="og:image:width" content="200" />'
        )
        self.assertContains(
            response, '<meta property="og:image:height" content="200" />'
        )

    def test_templates_person_detail_meta_description(self):
        """
        The person meta description should show meta_description placeholder if defined
        """
        person = PersonFactory()
        page = person.extended_object

        title_obj = page.get_title_obj(language="en")
        title_obj.meta_description = "A custom description of the person"
        title_obj.save()

        page.publish("en")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A custom description of the person" />',
        )

    def test_templates_person_detail_meta_description_bio(self):
        """
        The person meta description should show the bio if no meta_description is
        specified
        """
        person = PersonFactory()
        page = person.extended_object

        # Add a bio to a person
        placeholder = person.extended_object.placeholders.get(slot="bio")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A biographic description of the person",
        )
        page.publish("en")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A biographic description of the person" />',
        )

    def test_templates_person_detail_meta_description_bio_exceeds_max_length(self):
        """
        The person meta description should be cut if it exceeds more than 160 caracters
        """
        person = PersonFactory()
        page = person.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
        )

        # Add a bio to a person
        placeholder = person.extended_object.placeholders.get(slot="bio")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:160]
        self.assertContains(
            response,
            f'<meta name="description" content="{cut}" />',
        )

    def test_templates_person_detail_meta_description_empty(self):
        """
        The person meta description should not be present if neither the meta_description field
        on the page, nor the `bio` placeholder are filled
        """
        person = PersonFactory()
        page = person.extended_object
        page.publish("en")

        url = person.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            '<meta name="description"',
        )
