"""
End-to-end tests for the organization detail view
"""

import re
from unittest import mock

from django.test.utils import override_settings

import lxml.html
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
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

    def test_templates_organization_detail_open_graph_description_placeholder_description(
        self,
    ):
        """
        An opengraph description meta should be present if the organization excerpt or
        description placeholder is set.
        """
        organization = OrganizationFactory()
        page = organization.extended_object

        # Add a description to an organization
        placeholder = organization.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body="A long <b>description</b> of the organization  ",
        )
        page.publish("en")

        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta property="og:description" content="A long description of the organization" />',
        )

        # Add an excerpt to an organization
        placeholder = organization.extended_object.placeholders.get(slot="excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body="A long excerpt of the organization  ",
        )
        page.publish("en")

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta property="og:description" content="A long excerpt of the organization" />',
        )

    def test_templates_organization_detail_open_graph_description_excerpt_max_length(
        self,
    ):
        """
        The opengraph description meta should be cut if it exceeds more than 200
        characters
        """
        organization = OrganizationFactory()
        page = organization.extended_object

        # Add a description to the organization
        description_value = (
            "Long description that describes the page with a summary. " * 5
        )
        placeholder = organization.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body=description_value,
        )
        page.publish("en")

        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = description_value[0:200]
        self.assertContains(
            response,
            f'<meta property="og:description" content="{cut}" />',
        )

        # Add an excerpt to the organization
        excerpt_value = "Long excerpt that describes the page with a summary. " * 5
        placeholder = organization.extended_object.placeholders.get(slot="excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=excerpt_value,
        )
        page.publish("en")

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = excerpt_value[0:200]
        self.assertContains(
            response,
            f'<meta property="og:description" content="{cut}" />',
        )

    def test_templates_organization_detail_open_graph_description_empty(self):
        """
        The opengraph description should not be present if the excerpt and description
        placeholders aren't filled
        """
        organization = OrganizationFactory()
        page = organization.extended_object
        page.publish("en")

        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            "og:description",
        )

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
            response,
            "<title>La Sorbonne - example.com</title>",
            html=True,
            status_code=200,
        )
        self.assertContains(
            response,
            '<h1 class="organization-detail__title">La Sorbonne</h1>',
            html=True,
        )

        # Published category should not be on the page since we only display
        # them in draft mode
        self.assertNotContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                '<a class="category-tag" href="{:s}">'
                '<span class="category-tag__title">{:s}</span></a>'
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
            # pylint: disable=consider-using-f-string
            '<span class="course-glimpse__title-text">{0:s}</span>'.format(
                published_course.public_extension.extended_object.get_title(),
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

    @mock.patch(
        "cms.templatetags.cms_tags.PageUrl.get_value", return_value="/the/courses/"
    )
    @override_settings(RICHIE_GLIMPSE_PAGINATION={"courses": 2})
    def test_templates_organization_detail_cms_published_content_max_courses(
        self, _mock_page_url
    ):
        """
        Make sure the organization detail page does not display too many courses, even when a large
        number are related to the current organization, as this can cause the page to load very
        slowly and is not a great experience for the user anyway.
        """
        # Create our dummy organization and the 3 courses we'll attach to it
        organization = OrganizationFactory(should_publish=True)
        courses = CourseFactory.create_batch(
            3, fill_organizations=[organization], should_publish=True
        )
        # Link the 3 courses with our organization through the relevant placeholder
        for course in courses:
            add_plugin(
                course.extended_object.placeholders.get(slot="course_organizations"),
                OrganizationPlugin,
                "en",
                page=organization.extended_object,
            )
        # Make sure we do have 3 courses on the organization
        self.assertEqual(organization.get_courses().count(), 3)

        # Only the first two are rendered in the template
        response = self.client.get(organization.extended_object.get_absolute_url())
        self.assertContains(response, courses[0].extended_object.get_title())
        self.assertContains(response, courses[1].extended_object.get_title())
        self.assertNotContains(response, courses[2].extended_object.get_title())

        # There is a link to view more related courses directly in the Search view
        self.assertContains(
            response, f'href="/the/courses/?organizations={organization.get_es_id():s}"'
        )
        self.assertContains(
            response,
            f"See all courses related to {organization.extended_object.get_title():s}",
        )

    def test_templates_organization_detail_cms_draft_content(self):
        """
        A staff user should see a draft organization including only the related objects that
        are published.
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
            response,
            "<title>La Sorbonne - example.com</title>",
            html=True,
            status_code=200,
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
                # pylint: disable=consider-using-f-string
                '<a class="category-tag" href="{:s}">'
                '<span class="category-tag__title">{:s}</span></a>'
            ).format(
                published_category.public_extension.extended_object.get_absolute_url(),
                published_category.public_extension.extended_object.get_title(),
            ),
            html=True,
        )
        # The not published category should be on the page
        self.assertContains(
            response,
            (
                # pylint: disable=consider-using-f-string
                '<a class="category-tag category-tag--draft" href="{:s}">'
                '<span class="category-tag__title">{:s}</span></a>'
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
            '<span class="course-glimpse__title-text">modified course</span>',
            html=True,
        )

        # The not published course should be on the page
        self.assertContains(
            response,
            not_published_course.extended_object.get_title(),
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
        person_url = person.extended_object.get_absolute_url()
        person_name = person.extended_object.get_title()
        pattern = (
            rf'<a href="{person_url:s}">'
            r'<h3 class="person-glimpse__title">'
            rf".*{person_name:s}.*</h3></a>"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))

    def test_template_organization_detail_without_organization(self):
        """
        A organization template page without attached organization should show an error banner
        explaining to the user that he/she is misusing the template.
        """
        page = PageFactory(
            template="courses/cms/organization_detail.html",
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
                "A organization object is missing on this organization page. "
                "Please select another page template."
                "<br />"
                "If what you need is a organization page, you need to create it "
                'via the wizard and choose "New organization page".'
                "</p>"
                "</div>"
            ),
            html=True,
        )

    def test_templates_organization_detail_cms_published_content_opengraph(self):
        """The organization logo should be used as opengraph image."""
        organization = OrganizationFactory(
            fill_logo={"original_filename": "logo.jpg", "default_alt_text": "my logo"},
            should_publish=True,
        )
        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, '<meta property="og:type" content="website" />')
        self.assertContains(
            response, f'<meta property="og:url" content="http://example.com{url:s}" />'
        )
        pattern = (
            r'<meta property="og:image" content="http://example.com'
            r"/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x113"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        # No crop allowed so image stays square
        self.assertContains(
            response, '<meta property="og:image:width" content="113" />'
        )
        self.assertContains(
            response, '<meta property="og:image:height" content="113" />'
        )

    def test_templates_organization_detail_meta_description(self):
        """
        The organization meta description should show meta_description placeholder if defined
        """
        organization = OrganizationFactory()
        page = organization.extended_object

        title_obj = page.get_title_obj(language="en")
        title_obj.meta_description = "A longer organization description"
        title_obj.save()

        page.publish("en")

        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A longer organization description" />',
        )

    def test_templates_organization_detail_meta_description_description(self):
        """
        The organization meta description should be filled with excerpt placeholder
        content if filled else use a stripped version of description placeholder
        content.
        """
        organization = OrganizationFactory()
        page = organization.extended_object

        # Add a description to the organization
        placeholder = organization.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body=" A <b>longer</b> organization description  ",
        )
        page.publish("en")

        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A longer organization description" />',
        )

        # Add an excerpt to the organization
        placeholder = organization.extended_object.placeholders.get(slot="excerpt")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PlainTextPlugin",
            body=" A longer organization excerpt  ",
        )
        page.publish("en")

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A longer organization excerpt" />',
        )

    def test_templates_organization_detail_meta_description_excerpt_max_length(self):
        """
        The organization meta description should be cut if it exceeds more than 160 caracters
        """
        organization = OrganizationFactory()
        page = organization.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
        )

        # Add an excerpt to the organization
        placeholder = organization.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:160]
        self.assertContains(
            response,
            f'<meta name="description" content="{cut}" />',
        )

    def test_templates_organization_detail_meta_description_empty(self):
        """
        The organization meta description should not be present if neither the meta_description
        field on the page, nor the excerpt placeholder are filled
        """
        organization = OrganizationFactory()
        page = organization.extended_object
        page.publish("en")

        url = organization.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            '<meta name="description"',
        )

    def test_templates_organization_detail_empty_related_organizations(self):
        """
        A published organization page should not display the related organizations
        section if this placeholder is empty. In edit mode, the section should be
        displayed with an empty text.
        """
        organization = OrganizationFactory(should_publish=True)

        # In public mode, the related organizations section should not be present if
        # the placeholder is empty
        response = self.client.get(organization.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        section = html.cssselect(".organization-detail__organizations")
        self.assertEqual(section, [])

        # - In edit mode, the related organizations section should be present
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")
        response = self.client.get(organization.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)

        # The related organizations section should be present
        section = html.cssselect(".organization-detail__organizations")[0]
        self.assertIsNotNone(section)
        empty_text = section.cssselect(".organization-detail__empty")[0]
        self.assertEqual(
            empty_text.text_content().strip(),
            "Are there organizations affiliated to this organization?",
        )

    def test_templates_organization_detail_with_related_organizations(self):
        """
        A published organization page should display a related organizations section if
        the placeholder `related_organizations` is fulfilled.
        """
        organization = OrganizationFactory()
        page = organization.extended_object
        published_related_orga = OrganizationFactory(should_publish=True)
        unpublished_related_org = OrganizationFactory()

        # Add two related organizations
        for related_org in [published_related_orga, unpublished_related_org]:
            placeholder = page.placeholders.get(slot="related_organizations")
            add_plugin(
                language="en",
                placeholder=placeholder,
                plugin_type="OrganizationPlugin",
                page=related_org.extended_object,
            )
        # Then publish the organization page
        page.publish("en")

        # - In public mode, only published related organizations should be displayed
        response = self.client.get(page.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        section = html.cssselect(".organization-detail__organizations")[0]
        organization_glimpse = section.cssselect(".section__items--organizations > *")
        self.assertEqual(len(organization_glimpse), 1)

        self.assertEqual(
            organization_glimpse[0].cssselect("h3")[0].text_content().strip(),
            published_related_orga.extended_object.get_title(),
        )

        # - In edit mode, all related organizations should be displayed
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")
        response = self.client.get(organization.extended_object.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        html = lxml.html.fromstring(response.content)
        section = html.cssselect(".organization-detail__organizations")[0]
        organization_glimpse = section.cssselect(".section__items--organizations > *")
        self.assertEqual(len(organization_glimpse), 2)
