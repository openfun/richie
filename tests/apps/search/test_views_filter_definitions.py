"""Test suite for the filter_definition view of richie's search app."""

import json
from unittest import mock

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.factories import CategoryFactory
from richie.apps.search.filter_definitions import FILTERS


class FilterDefinitionsViewTestCase(CMSTestCase):
    """
    Test suite to validate the behavior of the `filter_definitions` view.
    """

    def tearDown(self):
        """
        Clear filter definitions cache for base pages. This helps us avoid breaking other
        tests because we create page and use their related filters through the reverse id.
        """
        for filter_definition in FILTERS.values():
            try:
                # pylint: disable=protected-access
                filter_definition._base_page = None
            except AttributeError:
                pass

    def test_views_filter_definitions(self):
        """
        Returns an object with all the filter definitions, keyed by machine name.
        """
        # Create pages with expected `reverse_id` to ensure the base paths are returned
        # as part of the filter definitions.
        create_i18n_page(
            {"en": "Organizations", "fr": "Organisations"},
            reverse_id="organizations",
            published=True,
        )
        create_i18n_page(
            {"en": "Persons", "fr": "Personnes"}, reverse_id="persons", published=True
        )
        categories_page = create_i18n_page(
            {"en": "Categories", "fr": "Catégories"}, published=True
        )
        CategoryFactory(
            page_parent=categories_page,
            page_reverse_id="subjects",
            page_title={"en": "Subjects", "fr": "Sujets"},
            should_publish=True,
        )
        CategoryFactory(
            page_parent=categories_page,
            page_reverse_id="levels",
            page_title={"en": "Levels", "fr": "Niveaux"},
            should_publish=True,
        )

        response = self.client.get("/api/v1.0/filter-definitions/")
        self.assertEqual(
            json.loads(response.content),
            {
                "new": {
                    "base_path": None,
                    "human_name": "New courses",
                    "is_autocompletable": False,
                    "is_drilldown": False,
                    "is_searchable": False,
                    "name": "new",
                    "position": 0,
                },
                "availability": {
                    "base_path": None,
                    "human_name": "Availability",
                    "is_autocompletable": False,
                    "is_drilldown": True,
                    "is_searchable": False,
                    "name": "availability",
                    "position": 1,
                },
                "subjects": {
                    "base_path": "00030001",
                    "human_name": "Subjects",
                    "is_autocompletable": True,
                    "is_drilldown": False,
                    "is_searchable": True,
                    "name": "subjects",
                    "position": 2,
                },
                "levels": {
                    "base_path": "00030002",
                    "human_name": "Levels",
                    "is_autocompletable": True,
                    "is_drilldown": False,
                    "is_searchable": True,
                    "name": "levels",
                    "position": 3,
                },
                "licences": {
                    "base_path": None,
                    "human_name": "Licences",
                    "is_autocompletable": True,
                    "is_drilldown": False,
                    "is_searchable": True,
                    "name": "licences",
                    "position": 7,
                },
                "organizations": {
                    "base_path": "0001",
                    "human_name": "Organizations",
                    "is_autocompletable": True,
                    "is_drilldown": False,
                    "is_searchable": True,
                    "name": "organizations",
                    "position": 4,
                },
                "languages": {
                    "base_path": None,
                    "human_name": "Languages",
                    "is_autocompletable": False,
                    "is_drilldown": False,
                    "is_searchable": False,
                    "name": "languages",
                    "position": 5,
                },
                "persons": {
                    "base_path": "0002",
                    "human_name": "Persons",
                    "is_autocompletable": True,
                    "is_drilldown": False,
                    "is_searchable": True,
                    "name": "persons",
                    "position": 6,
                },
                "pace": {
                    "base_path": None,
                    "human_name": "Weekly pace",
                    "is_autocompletable": False,
                    "is_drilldown": False,
                    "is_searchable": False,
                    "name": "pace",
                    "position": 8,
                },
            },
        )

    @mock.patch.object(
        FILTERS["new"],
        "get_definition",
        return_value={
            "new": {
                "base_path": None,
                "human_name": "New courses",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "new",
                "position": 0,
            }
        },
    )
    def test_views_filter_definitions_is_cached(self, mock_get_definition):
        """
        Make sure we don't re-build the static filter definitions with each call.
        """
        self.client.get("/api/v1.0/filter-definitions/")
        self.client.get("/api/v1.0/filter-definitions/")
        self.assertEqual(mock_get_definition.call_count, 1)
