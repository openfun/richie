"""Test suite for the get_categories_pages_additional_information template tag."""

from django.db import transaction

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CategoryFactory, CourseFactory
from richie.apps.courses.models.course import Course
from richie.apps.courses.templatetags.extra_tags import (
    get_categories_pages_additional_information,
)
from richie.plugins.nesteditem.defaults import ACCORDION


class GetCategoriesPagesAdditionalInformationTestCase(CMSTestCase):
    """
    Integration tests to validate the `get_categories_pages_additional_information` template tag.

    To get additional information successfully from a category page, the requirements are:

    - The category page needs to have created additional information
    - To the category page must be set the `id` in `Advanced Settings`
    which will be used as `reverse_id`
    - The category page must be published so the `show_placeholder` tag
    can find the component
    """

    def _add_info(self, component: CategoryFactory) -> CategoryFactory:
        """
        This method adds additional information to a category
        """

        placeholder = component.extended_object.placeholders.get(
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

        return component

    @transaction.atomic
    def test_get_categories_pages_additional_information_filled_list_with_lookup(self):
        """
        This test validates when a course has categories with additional information and
        the page_lookup `reverse_id` set the custom tag
        `get_categories_pages_additional_information` must return a list
        with the corresponding categories pages
        """

        category1 = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )
        icon1 = CategoryFactory.create(
            page_title="Available on edX.org", should_publish=True
        )
        icon2 = CategoryFactory.create(
            page_title="Payment promotion", should_publish=True
        )

        for component in [category1, category2, icon1, icon2]:
            reverse_id = component.extended_object.get_title().lower().replace(" ", "-")
            component.extended_object.reverse_id = reverse_id
            component.extended_object.save()

        for component in [category1, icon1]:
            component = self._add_info(component)

        course: Course = CourseFactory.create(
            fill_categories=[category1, category2],
            fill_icons=[icon1, icon2],
        )

        all_categories = course.get_categories()
        categories_pages_have_info = get_categories_pages_additional_information(course)

        self.assertTrue(len(all_categories) == 4)
        self.assertTrue(isinstance(categories_pages_have_info, list))
        self.assertTrue(len(categories_pages_have_info) == 2)

        for page in categories_pages_have_info:
            self.assertTrue(page.get_title() in ["Accessible", "Available on edX.org"])
            plugins = (
                page.get_placeholders().get(slot="additional_information").get_plugins()
            )
            self.assertTrue(len(plugins) > 0)

            self.assertTrue(plugins[0].plugin_type == "SectionPlugin")

            for plugin in plugins[1:]:
                self.assertTrue(plugin.plugin_type == "NestedItemPlugin")

    @transaction.atomic
    def test_get_categories_pages_additional_information_empty_list_with_lookup(self):
        """
        This test validates when a course does not have categories with additional information
        but with the page_lookup `reverse_id` set the custom tag
        `get_categories_pages_additional_information` must return an empty
        """

        category1 = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )
        icon1 = CategoryFactory.create(
            page_title="Available on edX.org", should_publish=True
        )
        icon2 = CategoryFactory.create(
            page_title="Payment promotion", should_publish=True
        )

        for component in [category1, category2, icon1, icon2]:
            reverse_id = component.extended_object.get_title().lower().replace(" ", "-")
            component.extended_object.reverse_id = reverse_id
            component.extended_object.save()

        course: Course = CourseFactory.create(
            fill_categories=[category1, category2],
            fill_icons=[icon1, icon2],
        )

        all_categories = course.get_categories()
        categories_pages_have_info = get_categories_pages_additional_information(course)

        self.assertTrue(len(all_categories) == 4)
        self.assertTrue(isinstance(categories_pages_have_info, list))
        self.assertTrue(len(categories_pages_have_info) == 0)

        for category in all_categories:
            page = category.extended_object
            plugins = (
                page.get_placeholders().get(slot="additional_information").get_plugins()
            )
            self.assertTrue(len(plugins) == 0)

    @transaction.atomic
    def test_get_categories_pages_additional_information_filled_list_no_lookup(self):
        """
        This test validates when a course has categories with additional information but
        without page_lookup `reverse_id` the custom tag
        `get_categories_pages_additional_information` must return an empty list
        """

        category1 = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )
        icon1 = CategoryFactory.create(
            page_title="Available on edX.org", should_publish=True
        )
        icon2 = CategoryFactory.create(
            page_title="Payment promotion", should_publish=True
        )

        for component in [category1, icon1]:
            component = self._add_info(component)

        course: Course = CourseFactory.create(
            fill_categories=[category1, category2],
            fill_icons=[icon1, icon2],
        )

        all_categories = course.get_categories()
        categories_pages_have_info = get_categories_pages_additional_information(course)

        self.assertTrue(len(all_categories) == 4)

        for category in all_categories:
            page = category.extended_object
            self.assertTrue(page.reverse_id is None)

        categories_have_info = [
            category
            for category in all_categories
            if len(
                category.extended_object.get_placeholders()
                .get(slot="additional_information")
                .get_plugins()
            )
            > 0
        ]
        self.assertTrue(len(categories_have_info) == 2)

        for category in categories_have_info:
            page = category.extended_object
            self.assertTrue(page.get_title() in ["Accessible", "Available on edX.org"])
            plugins = (
                page.get_placeholders().get(slot="additional_information").get_plugins()
            )

            self.assertTrue(plugins[0].plugin_type == "SectionPlugin")

            for plugin in plugins[1:]:
                self.assertTrue(plugin.plugin_type == "NestedItemPlugin")

        self.assertTrue(isinstance(categories_pages_have_info, list))
        self.assertTrue(len(categories_pages_have_info) == 0)

    @transaction.atomic
    def test_get_categories_pages_additional_information_filled_list_content(self):
        """
        This test validates when a course has categories with additional information it
        will insert to the content page their information
        """

        category1 = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )
        icon1 = CategoryFactory.create(
            page_title="Available on edX.org", should_publish=True
        )
        icon2 = CategoryFactory.create(
            page_title="Payment promotion", should_publish=True
        )

        for component in [category1, category2, icon1, icon2]:
            reverse_id = component.extended_object.get_title().lower().replace(" ", "-")
            component.extended_object.reverse_id = reverse_id
            component.extended_object.save()

        for component in [category1, icon1]:
            component = self._add_info(component)
            component.get_page().publish("en")

        course: Course = CourseFactory.create(
            fill_categories=[category1, category2],
            fill_icons=[icon1, icon2],
        )

        all_categories = course.get_categories()
        categories_pages_have_info = get_categories_pages_additional_information(course)

        self.assertTrue(len(all_categories) == 4)
        self.assertTrue(isinstance(categories_pages_have_info, list))
        self.assertTrue(len(categories_pages_have_info) == 2)

        page = course.get_page()
        page.publish("en")
        url = page.get_absolute_url()
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            '<div class="course-detail__additional-info course-detail__block course-detail__row">',
        )

        for question in range(1, 3):
            self.assertContains(
                response, f'<meta property="name" content="{question}. question?" />'
            )
            self.assertContains(
                response,
                f'<meta property="name" content="Answer of question {question}." />',
            )

    @transaction.atomic
    def test_get_categories_pages_additional_information_content_no_lookup(self):
        """
        This test validates when a course has categories with additional information but
        without `reverse_id` it will not insert the section title nor the
        section block
        """

        category1 = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )
        icon1 = CategoryFactory.create(
            page_title="Available on edX.org", should_publish=True
        )
        icon2 = CategoryFactory.create(
            page_title="Payment promotion", should_publish=True
        )

        for component in [category1, icon1]:
            component = self._add_info(component)
            component.get_page().publish("en")

        course: Course = CourseFactory.create(
            fill_categories=[category1, category2],
            fill_icons=[icon1, icon2],
        )

        page = course.get_page()
        page.publish("en")
        url = page.get_absolute_url()
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(
            response,
            '<div class="course-detail__additional-info course-detail__block course-detail__row">',
        )

        for question in range(1, 3):
            self.assertNotContains(
                response, f'<meta property="name" content="{question}. question?" />'
            )
            self.assertNotContains(
                response,
                f'<meta property="name" content="Answer of question {question}." />',
            )

    @transaction.atomic
    def test_get_categories_pages_additional_information_no_content_with_lookup(self):
        """
        This test validates when a course does not have categories with additional information but
        with `reverse_id` it will not insert the section title nor the section block
        """

        category1 = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )
        icon1 = CategoryFactory.create(
            page_title="Available on edX.org", should_publish=True
        )
        icon2 = CategoryFactory.create(
            page_title="Payment promotion", should_publish=True
        )

        for component in [category1, category2, icon1, icon2]:
            reverse_id = component.extended_object.get_title().lower().replace(" ", "-")
            component.extended_object.reverse_id = reverse_id
            component.extended_object.save()
            component.get_page().publish("en")

        course: Course = CourseFactory.create(
            fill_categories=[category1, category2],
            fill_icons=[icon1, icon2],
        )

        page = course.get_page()
        page.publish("en")
        url = page.get_absolute_url()
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(
            response,
            '<div class="course-detail__additional-info course-detail__block course-detail__row">',
        )

        for question in range(1, 3):
            self.assertNotContains(
                response, f'<meta property="name" content="{question}. question?" />'
            )
            self.assertNotContains(
                response,
                f'<meta property="name" content="Answer of question {question}." />',
            )
