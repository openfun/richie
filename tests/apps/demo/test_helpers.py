"""
Test suite for all helpers in the `courses` application
"""

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.models import Category
from richie.apps.demo.helpers import create_categories


class CoursesHelpersTestCase(CMSTestCase):
    """Test suite for the helpers of Richie's course app."""

    def test_helpers_create_categories(self):
        """
        The `create_categories` method should create the whole category tree and return
        only the leaf categories.
        """
        parent = create_i18n_page("Root page")
        test_info = {
            "page_title": "Subject",
            "children": [
                {
                    "page_title": {"en": "Computer science", "fr": "Informatique"},
                    "children": [
                        {"page_title": {"en": "Coding", "fr": "Programmation"}},
                        {"page_title": {"en": "Security", "fr": "Sécurité"}},
                    ],
                },
                {"page_title": "Languages"},
            ],
        }

        # The function returns a generator so it should not have been executed yet
        categories = create_categories(page_parent=parent, **test_info)
        self.assertFalse(Category.objects.exists())

        # Now force its execution and check that the category tree was created as expected
        categories = list(categories)
        self.assertEqual(Category.objects.count(), 5)
        self.assertEqual(len(list(categories)), 3)
        self.assertEqual(
            ["Coding", "Security", "Languages"],
            [c.extended_object.get_title() for c in categories],
        )
        self.assertEqual(
            [
                ["Root page", "Subject", "Computer science"],
                ["Root page", "Subject", "Computer science"],
                ["Root page", "Subject"],
            ],
            [
                [a.get_title() for a in c.extended_object.get_ancestor_pages()]
                for c in categories
            ],
        )
