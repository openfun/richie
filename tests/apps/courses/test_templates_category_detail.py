"""
End-to-end tests for the category detail view
"""

import datetime
import re
from unittest import mock

from django.test.utils import override_settings

import lxml.html
from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.factories import PageFactory, UserFactory
from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import CategoryPlugin
from richie.apps.courses.factories import (
    BlogPostFactory,
    CategoryFactory,
    CourseFactory,
    CourseRunFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.courses.models.course import CourseRun, CourseRunCatalogVisibility
from richie.plugins.nesteditem.defaults import ACCORDION


class CategoryCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the category detail view
    """

    def test_template_category_detail_open_graph_description(self):
        """
        An opengraph description meta should be present if the description placeholder is set.
        """
        category = CategoryFactory()
        page = category.extended_object

        # Add an description to the category
        placeholder = category.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body=" A further <b>description</b> of the category  ",
        )
        page.publish("en")

        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta property="og:description" content="A further description of the category" />',
        )

    def test_template_category_detail_open_graph_description_max_length(self):
        """
        An opengraph description meta should be cut if it exceeds more than 200 caracters
        """
        category = CategoryFactory()
        page = category.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. " * 5
        )

        # Add an description to the category
        placeholder = category.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:200]
        self.assertContains(
            response,
            f'<meta property="og:description" content="{cut}" />',
        )

    def test_template_category_detail_open_graph_description_empty(self):
        """
        The opengraph description meta should not be present if description placeholder is not set
        """
        category = CategoryFactory()
        page = category.extended_object
        page.publish("en")

        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            "og:description",
        )

    def _extension_cms_published_content(
        self, factory_model, placeholder_slot, selector
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
        html = lxml.html.fromstring(response.content)

        self.assertContains(
            response,
            "<title>Maths - Category - example.com</title>",
            html=True,
            status_code=200,
        )
        self.assertContains(
            response, '<h1 class="category-detail__title">Maths</h1>', html=True
        )

        # The published extension should be on the page in its published version
        element = html.cssselect(selector)[0]
        self.assertEqual(
            element.text_content().strip(),
            published_extension.public_extension.extended_object.get_title(),
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
            'h3.organization-glimpse__title[property="name"]',
        )

    def test_templates_category_detail_cms_published_content_courses(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related courses in all publication states.
        """
        self._extension_cms_published_content(
            CourseFactory,
            "course_categories",
            "h3.course-glimpse__title",
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
            "h3.blogpost-glimpse__title",
        )

    def test_templates_category_detail_cms_published_content_persons(self):
        """
        Validate that the important elements are displayed on a published category page and check
        related persons in all publication states.
        """
        self._extension_cms_published_content(
            PersonFactory, "categories", "h3.person-glimpse__title"
        )

    def test_templates_category_detail_cms_published_content_opengraph(self):
        """The category logo should be used as opengraph image."""
        category = CategoryFactory(
            fill_logo={"original_filename": "logo.jpg", "default_alt_text": "my logo"},
            should_publish=True,
        )
        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, '<meta property="og:type" content="website" />')
        self.assertContains(
            response, f'<meta property="og:url" content="http://example.com{url:s}" />'
        )
        pattern = (
            r'<meta property="og:image" content="http://example.com'
            r"/media/filer_public_thumbnails/filer_public/.*logo\.jpg__200x200"
        )
        self.assertIsNotNone(re.search(pattern, str(response.content)))
        self.assertContains(
            response, '<meta property="og:image:width" content="200" />'
        )
        self.assertContains(
            response, '<meta property="og:image:height" content="200" />'
        )

    def _extension_cms_draft_content(self, factory_model, selector):
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
        html = lxml.html.fromstring(response.content)

        self.assertContains(
            response,
            "<title>Maths - Category - example.com</title>",
            html=True,
            status_code=200,
        )
        self.assertContains(
            response, '<h1 class="category-detail__title">Maths</h1>', html=True
        )

        titles = [
            published_extension.extended_object.get_title(),
            not_published_extension.extended_object.get_title(),
        ]
        # The published page extension should be on the page in its published version
        # The not published page extension should be on the page, mark as draft
        for element in html.cssselect(selector):
            self.assertIn(element.text_content().strip(), titles)

    def test_templates_category_detail_cms_draft_content_organizations(self):
        """Validate how a draft category page is displayed with its related organizations."""
        self._extension_cms_draft_content(
            OrganizationFactory,
            "h3.organization-glimpse__title",
        )

    def test_templates_category_detail_cms_draft_content_courses(self):
        """Validate how a draft category page is displayed with its related courses."""
        self._extension_cms_draft_content(CourseFactory, "h3.course-glimpse__title")

    def test_templates_category_detail_cms_draft_content_blogposts(self):
        """Validate how a draft category page is displayed with its related blogposts."""
        self._extension_cms_draft_content(BlogPostFactory, "h3.blogpost-glimpse__title")

    def test_templates_category_detail_cms_draft_content_persons(self):
        """Validate how a draft category page is displayed with its related persons."""
        self._extension_cms_draft_content(PersonFactory, "h3.person-glimpse__title")

    def test_template_category_detail_without_category(self):
        """
        A category template page without attached category should show an error banner
        explaining to the user that he/she is misusing the template.
        """
        page = PageFactory(
            template="courses/cms/category_detail.html",
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
                "A category object is missing on this category page. "
                "Please select another page template."
                "<br />"
                "If what you need is a category page, you need to create it "
                'via the wizard and choose "New category page".'
                "</p>"
                "</div>"
            ),
            html=True,
        )

    def test_template_category_detail_meta_description(self):
        """
        The category meta description should show meta_description placeholder if defined
        """
        category = CategoryFactory()
        page = category.extended_object

        title_obj = page.get_title_obj(language="en")
        title_obj.meta_description = "A custom description of the category"
        title_obj.save()

        page.publish("en")

        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A custom description of the category" />',
        )

    def test_template_category_detail_meta_description_description(self):
        """
        The category meta description should show the description if no meta_description is
        specified
        """
        category = CategoryFactory()
        page = category.extended_object

        # Add an description to the category
        placeholder = category.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body=" A further <b>description</b> of the category  ",
        )
        page.publish("en")

        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertContains(
            response,
            '<meta name="description" content="A further description of the category" />',
        )

    def test_template_category_detail_meta_description_description_max_length(self):
        """
        The category meta description should be cut if it exceeds more than 160 caracters
        """
        category = CategoryFactory()
        page = category.extended_object
        placeholder_value = (
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
            "Long description that describes the page with a summary. "
        )

        # Add an description to the category
        placeholder = category.extended_object.placeholders.get(slot="description")
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="CKEditorPlugin",
            body=placeholder_value,
        )
        page.publish("en")

        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        cut = placeholder_value[0:160]
        self.assertContains(
            response,
            f'<meta name="description" content="{cut}" />',
        )

    def test_template_category_detail_meta_description_empty(self):
        """
        The category meta description should not be present if neither the meta_description field
        on the page, nor the description placeholder are filled
        """
        category = CategoryFactory()
        page = category.extended_object
        page.publish("en")

        url = category.extended_object.get_absolute_url()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertNotContains(
            response,
            '<meta name="description"',
        )


class CategoryAdditionalInfoCMSTestCase(CMSTestCase):
    """
    End-to-end test suite to validate the content and Ux of the category detail view
    in terms of the additional information section
    """

    def test_template_category_detail_additional_information(self):
        """
        Validates the creation of additional information for a category and its content
        """

        info_quantity = 3
        category = CategoryFactory.create(page_title="Accessible", should_publish=True)
        placeholder = category.extended_object.placeholders.get(
            slot="additional_information"
        )

        section = add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title="Additional Information",
        )

        container = add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="NestedItemPlugin",
            variant=ACCORDION,
            target=section,
        )

        for question in range(1, info_quantity):
            question_container = add_plugin(
                language="en",
                placeholder=placeholder,
                plugin_type="NestedItemPlugin",
                target=container,
                content=f"{question}. question?",
                variant=ACCORDION,
            )

            add_plugin(
                language="en",
                placeholder=placeholder,
                plugin_type="NestedItemPlugin",
                target=question_container,
                content=f"Answer of question {question}.",
                variant=ACCORDION,
            )

        page = category.get_page()
        page.publish("en")
        url = page.get_absolute_url()
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Additional Information")

        for question in range(1, info_quantity):
            self.assertContains(response, f"{question}. question?")
            self.assertContains(response, f"Answer of question {question}.")

    def test_template_category_detail_no_additional_info_edit_mode(self):
        """
        Validates the behavior whether editing the page or not to show
        the message indicating that it is possible to enter data to
        the section of additional information
        """

        category = CategoryFactory.create(page_title="Accessible", should_publish=True)

        page = category.get_page()
        page.publish("en")

        url = page.get_absolute_url()
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(
            response, "Enter additional information for this category"
        )

        staff = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=staff.username, password="password")
        url = f"{url:s}?edit"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Enter additional information for this category")

    def test_template_category_detail_additional_info_page_id(self):
        """
        Validates the behavior when the page has additional information
        but without page id, it shows the message indicating to register
        the page id
        """

        category = CategoryFactory.create(page_title="Accessible", should_publish=True)
        placeholder = category.extended_object.placeholders.get(
            slot="additional_information"
        )

        section = add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="SectionPlugin",
            title="Additional Information",
        )

        container = add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="NestedItemPlugin",
            variant=ACCORDION,
            target=section,
        )

        for question in range(1, 3):
            question_container = add_plugin(
                language="en",
                placeholder=placeholder,
                plugin_type="NestedItemPlugin",
                target=container,
                content=f"{question}. question?",
                variant=ACCORDION,
            )

            add_plugin(
                language="en",
                placeholder=placeholder,
                plugin_type="NestedItemPlugin",
                target=question_container,
                content=f"Answer of question {question}.",
                variant=ACCORDION,
            )

        message = (
            "Configure this page id to show this additional "
            "information on all related course pages"
        )

        page = category.get_page()
        page.publish("en")
        url = page.get_absolute_url()

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, message)

        page.reverse_id = "accessible"
        page.save()
        page.publish("en")

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, message)

    def test_templates_category_detail_cms_published_hidden_courses(self):
        """
        Ensures that changing the course run `catalog_visibility` paratemer
        will prevent it from showing on the category detail page
        """

        category = CategoryFactory(should_publish=True)
        course = CourseFactory.create(fill_categories=[category], should_publish=True)
        CourseRunFactory.create(
            direct_course=course,
            catalog_visibility=CourseRunCatalogVisibility.COURSE_AND_SEARCH,
            start=datetime.datetime.now(),
            end=datetime.datetime.now() + datetime.timedelta(days=5),
            enrollment_start=datetime.datetime.now() - datetime.timedelta(days=2),
            enrollment_end=datetime.datetime.now() - datetime.timedelta(days=1),
        )

        course.refresh_from_db()
        add_plugin(
            course.extended_object.placeholders.get(slot="course_categories"),
            CategoryPlugin,
            "en",
            page=category.extended_object,
        )

        courses_query = category.get_courses()

        self.assertEqual(courses_query.count(), 1)
        self.assertEqual(course.state["priority"], 5)
        self.assertEqual(course.state["text"], "on-going")

        course_runs = CourseRun.objects.filter(direct_course=course)
        self.assertEqual(len(course_runs), 1)

        course_runs[0].catalog_visibility = CourseRunCatalogVisibility.HIDDEN
        course_runs[0].save()

        courses_query = category.get_courses()

        self.assertEqual(courses_query.count(), 1)
        self.assertEqual(course.state["priority"], 7)
        self.assertEqual(course.state["text"], "to be scheduled")
