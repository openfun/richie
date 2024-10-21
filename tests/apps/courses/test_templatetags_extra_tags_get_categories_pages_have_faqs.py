"""Test suite for the get_categories_pages_have_faqs template tag."""

from django.db import transaction

from cms.api import add_plugin
from cms.test_utils.testcases import CMSTestCase

from richie.apps.courses.factories import CategoryFactory, CourseFactory
from richie.plugins.nesteditem.defaults import ACCORDION

from richie.apps.courses.templatetags.extra_tags import get_categories_pages_have_faqs
from cms.templatetags.cms_tags import (
    Placeholder,
    PlaceholderOptions,
    _get_page_by_untyped_arg,
)

class GetCategoriesPagesHaveFAQsTemplateTagsTestCase(CMSTestCase):
    """
    Integration tests to validate the behavior of the `get_categories_pages_have_faqs` template tag.
    """

    @transaction.atomic
    def test_templatetags_get_categories_pages_have_faqs_current_page(self):

        category1: CategoryFactory = CategoryFactory.create(page_title="Accessible", should_publish=True)
        category2 = CategoryFactory.create(
            page_title="Earth and universe sciences", should_publish=True
        )

        placeholder = category1.extended_object.placeholders.get(slot="course_faq")
        container = add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="NestedItemPlugin",
            variant=ACCORDION,
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

            for answer in range(1, 3):
                add_plugin(
                    language="en",
                    placeholder=placeholder,
                    plugin_type="NestedItemPlugin",
                    target=question_container,
                    content=f"{question}.{answer} - Answer of question {question}.",
                    variant=ACCORDION,
                )
        
        course = CourseFactory(fill_categories=[category1, category2])
    
        pages_have_faq = get_categories_pages_have_faqs(course)

        course_faq: Placeholder = category1.extended_object.get_placeholders().get(slot="course_faq")
        self.assertTrue(course_faq != None)
        self.assertTrue(len(course_faq.get_plugins_list()) > 0)
      