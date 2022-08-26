"""Test suite for the filter_definition view of richie's search app."""
import json
from unittest import mock

from django.test import override_settings

from cms.test_utils.testcases import CMSTestCase

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.factories import CategoryFactory
from richie.apps.search.defaults import build_filters_configuration
from richie.apps.search.filter_definitions import FILTERS

# pylint: disable=too-many-public-methods


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
                    "position": 6,
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
                    "position": 5,
                },
                "pace": {
                    "base_path": None,
                    "human_name": "Weekly pace",
                    "is_autocompletable": False,
                    "is_drilldown": False,
                    "is_searchable": False,
                    "name": "pace",
                    "position": 7,
                },
            },
        )

    @mock.patch.object(
        FILTERS["new"],
        "get_static_definitions",
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
    def test_views_filter_definitions_is_cached(self, mock_get_static_definitions):
        """
        Make sure we don't re-build the static filter definitions with each call.
        """
        self.client.get("/api/v1.0/filter-definitions/")
        self.client.get("/api/v1.0/filter-definitions/")
        self.assertEqual(mock_get_static_definitions.call_count, 1)

    @staticmethod
    def filter_configuration_for_enabled_tests() -> list:
        """A simpler filter configuration with only the filter names"""
        filter_config = []
        # pylint: disable=unused-variable
        for path, params in build_filters_configuration():
            filter_config.append(params.get("name"))
            for filter_wrapper in params.get("filters", []):
                filter_config.append(filter_wrapper[1].get("name"))
        filter_config.sort()
        return filter_config

    @override_settings(RICHIE_FILTERS_CONFIGURATION_NEW_ENABLED=False)
    def test_filter_setting_disable_new(self):
        """
        Test if it's possible to hide the `new` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "languages",
                "levels",
                "licences",
                "organizations",
                "pace",
                "persons",
                "subjects",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_AVAILABILITY_ENABLED=False)
    def test_filter_setting_disable_availability(self):
        """
        Test if it's possible to hide the `availability` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "course_runs",
                "languages",
                "levels",
                "licences",
                "new",
                "organizations",
                "pace",
                "persons",
                "subjects",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_LANGUAGES_ENABLED=False)
    def test_filter_setting_disable_languages(self):
        """
        Test if it's possible to hide the `languages` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "levels",
                "licences",
                "new",
                "organizations",
                "pace",
                "persons",
                "subjects",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_SUBJECTS_ENABLED=False)
    def test_filter_setting_disable_subjects(self):
        """
        Test if it's possible to hide the `subjects` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "languages",
                "levels",
                "licences",
                "new",
                "organizations",
                "pace",
                "persons",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_LEVELS_ENABLED=False)
    def test_filter_setting_disable_levels(self):
        """
        Test if it's possible to hide the `levels` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "languages",
                "licences",
                "new",
                "organizations",
                "pace",
                "persons",
                "subjects",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_ORGANIZATIONS_ENABLED=False)
    def test_filter_setting_disable_organizations(self):
        """
        Test if it's possible to hide the `organizations` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "languages",
                "levels",
                "licences",
                "new",
                "pace",
                "persons",
                "subjects",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_PERSONS_ENABLED=False)
    def test_filter_setting_disable_persons(self):
        """
        Test if it's possible to hide the `persons` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "languages",
                "levels",
                "licences",
                "new",
                "organizations",
                "pace",
                "subjects",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_LICENCES_ENABLED=False)
    def test_filter_setting_disable_licences(self):
        """
        Test if it's possible to hide the `licences` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "languages",
                "levels",
                "new",
                "organizations",
                "pace",
                "persons",
                "subjects",
            ],
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_PACE_ENABLED=False)
    def test_filter_setting_disable_pace(self):
        """
        Test if it's possible to hide the `pace` filter.
        """
        self.assertListEqual(
            self.filter_configuration_for_enabled_tests(),
            [
                "availability",
                "course_runs",
                "languages",
                "levels",
                "licences",
                "new",
                "organizations",
                "persons",
                "subjects",
            ],
        )

    @staticmethod
    def filter_configuration_for_position_tests() -> dict:
        """
        A simpler filter configuration with a dict with filter name has key and position has value
        """
        filter_config = {}
        # pylint: disable=unused-variable
        for path, params in build_filters_configuration():
            filter_config[params.get("name")] = params.get("position")
            for filter_wrapper in params.get("filters", []):
                filter_config[filter_wrapper[1].get("name")] = filter_wrapper[1].get(
                    "position"
                )
        return filter_config

    @override_settings(RICHIE_FILTERS_CONFIGURATION_NEW_POSITION=99)
    def test_filter_setting_position_new(self):
        """
        Test if it's possible to change the position of the `new` filter.
        """
        self.assertEqual(99, self.filter_configuration_for_position_tests().get("new"))

    @override_settings(RICHIE_FILTERS_CONFIGURATION_AVAILABILITY_POSITION=99)
    def test_filter_setting_position_availability(self):
        """
        Test if it's possible to change the position of the `availability` filter.
        """
        self.assertEqual(
            99, self.filter_configuration_for_position_tests().get("availability")
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_LANGUAGES_POSITION=99)
    def test_filter_setting_position_language(self):
        """
        Test if it's possible to change the position of the `languages` filter.
        """
        self.assertEqual(
            99, self.filter_configuration_for_position_tests().get("languages")
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_SUBJECTS_POSITION=99)
    def test_filter_setting_position_subjects(self):
        """
        Test if it's possible to change the position of the `subjects` filter.
        """
        self.assertEqual(
            99, self.filter_configuration_for_position_tests().get("subjects")
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_LEVELS_POSITION=99)
    def test_filter_setting_position_levels(self):
        """
        Test if it's possible to change the position of the `levels` filter.
        """
        self.assertEqual(
            99, self.filter_configuration_for_position_tests().get("levels")
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_ORGANIZATIONS_POSITION=99)
    def test_filter_setting_position_organizations(self):
        """
        Test if it's possible to change the position of the `organizations` filter.
        """
        self.assertEqual(
            99, self.filter_configuration_for_position_tests().get("organizations")
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_PERSONS_POSITION=99)
    def test_filter_setting_position_persons(self):
        """
        Test if it's possible to change the position of the `persons` filter.
        """
        self.assertEqual(
            99, self.filter_configuration_for_position_tests().get("persons")
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_LICENCES_POSITION=99)
    def test_filter_setting_position_licences(self):
        """
        Test if it's possible to change the position of the `licences` filter.
        """
        self.assertEqual(
            99, self.filter_configuration_for_position_tests().get("licences")
        )

    @override_settings(RICHIE_FILTERS_CONFIGURATION_PACE_POSITION=99)
    def test_filter_setting_position_pace(self):
        """
        Test if it's possible to change the position of the `pace` filter.
        """
        self.assertEqual(99, self.filter_configuration_for_position_tests().get("pace"))
