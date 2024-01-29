"""Tests for limits and related properties in facet counts in course searches."""

# pylint: disable=too-many-lines
from unittest import mock

from django.core.cache import caches
from django.test import TestCase

import arrow

from richie.apps.courses.factories import CategoryFactory
from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.filter_definitions import (
    FILTERS,
    FILTERS_CONFIGURATION,
    NestingWrapper,
)
from richie.apps.search.filter_definitions.courses import (
    ALL_LANGUAGES_DICT,
    IndexableHierarchicalFilterDefinition,
)
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS

NEW_LANGUAGES = list(ALL_LANGUAGES_DICT.items())[:11]
NEW_LANGUAGES_DICT = dict(NEW_LANGUAGES)


# Reduce the number of languages down to the top 11 (for simplicity, like our 11 subjects)
@mock.patch.dict(ALL_LANGUAGES_DICT, **NEW_LANGUAGES_DICT, clear=True)
@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    CoursesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_courses",
)
class FacetsCoursesQueryTestCase(TestCase):
    """
    Test search queries on courses to make sure they respect our default and maximum limits
    for displayed facet counts in filters.

    NB: We run all tests on two different filters as there are two different implementations
    under the hood: one for automatic ES "terms" filters, and another one for manual filters
    based on hand-crafted aggregations.
    """

    def setUp(self):
        """Reset indexable filters cache before each test so the context is as expected."""
        super().setUp()
        self.reset_filter_definitions_cache()

    def tearDown(self):
        """Reset indexable filters cache after each test to avoid impacting subsequent tests."""
        super().tearDown()
        self.reset_filter_definitions_cache()

    @staticmethod
    def reset_filter_definitions_cache():
        """Reset indexable filters cache on the `base_page` and `aggs_include` fields."""
        caches["search"].clear()
        for filter_name in ["levels", "subjects", "organizations"]:
            # pylint: disable=protected-access
            FILTERS[filter_name]._base_page = None

    @staticmethod
    def prepare_indices():
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class: create and fill the
        index with our courses so we can run our queries and check our facet counts.
        It also executes the query and returns the result from the API.
        """
        ES_INDICES_CLIENT.delete(index="_all")

        # Create an index for our categories
        ES_INDICES_CLIENT.create(index="richie_categories")
        ES_INDICES_CLIENT.close(index="richie_categories")
        ES_INDICES_CLIENT.put_settings(
            body=ANALYSIS_SETTINGS, index="richie_categories"
        )
        ES_INDICES_CLIENT.open(index="richie_categories")
        ES_INDICES_CLIENT.put_mapping(
            body=CategoriesIndexer.mapping, index="richie_categories"
        )

        # Set up empty indices for other objects. They need to exist to avoid errors
        # but we do not use results from them in our tests.
        ES_INDICES_CLIENT.create(index="richie_licences")
        ES_INDICES_CLIENT.create(index="richie_organizations")
        ES_INDICES_CLIENT.create(index="richie_persons")

        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index="test_courses")
        ES_INDICES_CLIENT.close(index="test_courses")
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="test_courses")
        ES_INDICES_CLIENT.open(index="test_courses")
        # Use the default courses mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(body=CoursesIndexer.mapping, index="test_courses")
        # Add the sorting script
        ES_CLIENT.put_script(id="score", body=CoursesIndexer.scripts["score"])
        ES_CLIENT.put_script(
            id="state_field", body=CoursesIndexer.scripts["state_field"]
        )

        # Create the subject category page. This is necessary to link the subjects
        # with the "subjects" filter.
        # As it is the first page we create, we expect it to have the path "0001".
        subject_meta = CategoryFactory(
            page_reverse_id="subjects", page_title="Subjects", should_publish=True
        )
        subjects = [
            CategoryFactory(
                page_parent=subject_meta.extended_object,
                page_title=subject_name,
                should_publish=True,
            )
            for subject_name in [
                "Science",
                "Human and social sciences",
                "Law",
                "Economy and Finance",
                "Education and Training",
                "Management",
                "Entrepreneurship",
                "Computer science",
                "Languages",
                "Education and career guidance",
                "Health",
            ]
        ]

        courses = [
            {
                "categories": [subject.get_es_id() for subject in subjects],
                "categories_names": {
                    "en": [subject.extended_object.get_title() for subject in subjects]
                },
                "course_runs": [
                    {"languages": [language[0] for language in NEW_LANGUAGES]}
                ],
                "description": {
                    "en": "Lorem ipsum dolor sit amet, consectetur adipiscim."
                },
                "id": "101",
                "is_new": True,
                "is_listed": True,
                "organizations": [],
                "organizations_names": {"en": []},
                "persons": [],
                "persons_names": {"en": []},
                "title": {"en": "Lorem ipsum dolor sit amet, consectetur adipiscim."},
            },
            {
                "categories": [
                    subjects[1].get_es_id(),
                    subjects[2].get_es_id(),
                ],
                "categories_names": {
                    "en": [
                        subjects[1].extended_object.get_title(),
                        subjects[2].extended_object.get_title(),
                    ]
                },
                "course_runs": [
                    {"languages": [NEW_LANGUAGES[1][0], NEW_LANGUAGES[2][0]]}
                ],
                "description": {
                    "en": "Artisanally-sourced clicks neque. erat volutpat."
                },
                "id": "102",
                "is_new": True,
                "is_listed": True,
                "organizations": [],
                "organizations_names": {"en": []},
                "persons": [],
                "persons_names": {},
                "title": {"en": "Artisanally-sourced clicks neque. erat volutpat."},
            },
            {
                "categories": [
                    subjects[3].get_es_id(),
                    subjects[4].get_es_id(),
                ],
                "categories_names": {
                    "en": [
                        subjects[3].extended_object.get_title(),
                        subjects[4].extended_object.get_title(),
                    ]
                },
                "course_runs": [
                    {"languages": [NEW_LANGUAGES[3][0], NEW_LANGUAGES[4][0]]}
                ],
                "description": {"en": "Cursus honorum finite que non luctus ante."},
                "id": "103",
                "is_new": False,
                "is_listed": True,
                "organizations": [],
                "organizations_names": {"en": []},
                "persons": [],
                "persons_names": {},
                "title": {"en": "Cursus honorum finite que non luctus ante."},
            },
            {
                "categories": [subjects[0].get_es_id()],
                "categories_names": {"en": [subjects[0].extended_object.get_title()]},
                "course_runs": [{"languages": [NEW_LANGUAGES[0][0]]}],
                "description": {"en": "Nullam ornare finibus sollicitudin."},
                "id": "104",
                "is_new": False,
                "is_listed": True,
                "organizations": [],
                "organizations_names": {"en": []},
                "persons": [],
                "persons_names": {"en": []},
                "title": {"en": "Nullam ornare finibus sollicitudin."},
            },
        ]

        # Prepare actions to insert categories and courses into their indices
        actions = [
            CategoriesIndexer.get_es_document_for_category(subject.public_extension)
            for subject in subjects
        ] + [
            {
                "_id": course["id"],
                "_index": "test_courses",
                "_op_type": "create",
                "absolute_url": {"en": "url"},
                "cover_image": {"en": "image"},
                "title": {"en": "title"},
                **course,
                "course_runs": [
                    {
                        "languages": course_run["languages"],
                        "start": arrow.utcnow().datetime,
                        "end": arrow.utcnow().datetime,
                        "enrollment_start": arrow.utcnow().datetime,
                        "enrollment_end": arrow.utcnow().datetime,
                    }
                    for course_run in course["course_runs"]
                ],
            }
            for course in courses
        ]

        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        return {"courses": courses, "subjects": subjects}

    def test_query_courses_facets_sorting_alphabetical(self, *_):
        """
        The "facet_sorting" parameter is respected for alphabetical sorting, and is
        prioritized over the default sorting as defined by the filter configutation.
        """
        data = self.prepare_indices()
        response = self.client.get(
            "/api/v1.0/courses/?scope=filters&facet_sorting=name"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 1,
                        "human_name": "Computer science",
                        "key": data["subjects"][7].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Education and career guidance",
                        "key": data["subjects"][9].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Entrepreneurship",
                        "key": data["subjects"][6].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Languages",
                        "key": data["subjects"][8].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Management",
                        "key": data["subjects"][5].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                ],
            },
        )

    def test_query_courses_facets_sorting_by_count(self, *_):
        """
        The "facet_sorting" parameter is respected for facet count sorting, and is
        prioritized over the default sorting as defined by the filter configutation.
        """
        data = self.prepare_indices()
        response = self.client.get(
            "/api/v1.0/courses/?scope=filters&facet_sorting=count"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Computer science",
                        "key": data["subjects"][7].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Education and career guidance",
                        "key": data["subjects"][9].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Entrepreneurship",
                        "key": data["subjects"][6].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Languages",
                        "key": data["subjects"][8].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Management",
                        "key": data["subjects"][5].get_es_id(),
                    },
                ],
            },
        )

    def test_query_courses_facets_sorting_default(self, *_):
        """
        When there is no "facet_sorting" param, the default sorting is used.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Computer science",
                        "key": data["subjects"][7].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Education and career guidance",
                        "key": data["subjects"][9].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Entrepreneurship",
                        "key": data["subjects"][6].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Languages",
                        "key": data["subjects"][8].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Management",
                        "key": data["subjects"][5].get_es_id(),
                    },
                ],
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=5,
    )
    def test_query_courses_uses_default_facet_limit(self, *_):
        """
        Ensure the query returns up to the top N facet values as defined by the
        `FACET_COUNTS_DEFAULT_LIMIT` for any given filter, no matter the number of
        available facet values.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                ],
            },
        )
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": True,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                ],
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=5,
    )
    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_MAX_LIMIT", new=10
    )
    def test_query_courses_returns_all_requested_facets_from_aggs(self, *_):
        """
        When the `foo_aggs` parameter is present in the query, more values are included
        in the facet counts for the `foo` filter, up to `FACET_COUNTS_MAX_LIMIT`.
        """
        # `languages_aggs` is not supported in the form & query builder. It should not
        # change the response.
        data = self.prepare_indices()
        response = self.client.get(
            "/api/v1.0/courses/?scope=filters&languages_aggs=stub&subjects_aggs="
            + ",".join([subject.get_es_id() for subject in data["subjects"]])
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Computer science",
                        "key": data["subjects"][7].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Education and career guidance",
                        "key": data["subjects"][9].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Entrepreneurship",
                        "key": data["subjects"][6].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Languages",
                        "key": data["subjects"][8].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Management",
                        "key": data["subjects"][5].get_es_id(),
                    },
                ],
            },
        )
        # Languages response is still down to the top 5 facets because `languages_aggs` is not
        # supported in the form & query builder. It therefore does not change the response.
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": True,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                ],
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=5,
    )
    def test_query_courses_just_has_more_values(self, *_):
        """
        The applicable limit is set to 5. As we have 11 subjects/languages, it's straightforward
        to conclude that there are more values.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                ],
            },
        )
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": True,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                ],
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=11,
    )
    def test_query_courses_just_has_no_more_values(self, *_):
        """
        The applicable limit is set to 11. This is the exact opposite of the above test:
        we have 11 subjects/languages, it's straightforward to conclude that there are
        *no* more values.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": False,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Computer science",
                        "key": data["subjects"][7].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Education and career guidance",
                        "key": data["subjects"][9].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Entrepreneurship",
                        "key": data["subjects"][6].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Health",
                        "key": data["subjects"][10].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Languages",
                        "key": data["subjects"][8].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Management",
                        "key": data["subjects"][5].get_es_id(),
                    },
                ],
            },
        )
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": False,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                    {"count": 1, "human_name": "Belarusian", "key": "be"},
                    {"count": 1, "human_name": "Bengali", "key": "bn"},
                    {"count": 1, "human_name": "Bosnian", "key": "bs"},
                    {"count": 1, "human_name": "Breton", "key": "br"},
                    {"count": 1, "human_name": "Bulgarian", "key": "bg"},
                    {"count": 1, "human_name": "Catalan", "key": "ca"},
                ],
            },
        )

    # NB: For the following tests, we separate subjects and languages related tests because
    # interaction between the filters make the tests harder to understand.
    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=9,
    )
    def test_query_courses_terms_barely_has_more_values_edge_case(self, *_):
        """
        Edge case: we ask for N values and get back M where applicable limit < M < N.
        This is a case where there *are* more values because at least one of the values beyond
        the applicable limit is not in our `subjects` filters.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?scope=filters"
                f"&subjects={data['subjects'][0].get_es_id()}"
                f"&subjects={data['subjects'][10].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Computer science",
                        "key": data["subjects"][7].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Entrepreneurship",
                        "key": data["subjects"][6].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Health",
                        "key": data["subjects"][10].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Languages",
                        "key": data["subjects"][8].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Management",
                        "key": data["subjects"][5].get_es_id(),
                    },
                ],
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=9,
    )
    def test_query_courses_manual_barely_has_more_values_edge_case(self, *_):
        """
        Edge case: we ask for N values and get back M where applicable limit < M < N.
        This is a case where there *are* more values because at least one of the values beyond
        the applicable limit is not in our `languages` filter.
        """
        self.prepare_indices()
        response = self.client.get(
            "/api/v1.0/courses/?scope=filters&languages=az&languages=ca"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": True,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                    {"count": 1, "human_name": "Bengali", "key": "bn"},
                    {"count": 1, "human_name": "Bosnian", "key": "bs"},
                    {"count": 1, "human_name": "Breton", "key": "br"},
                    {"count": 1, "human_name": "Bulgarian", "key": "bg"},
                    {"count": 1, "human_name": "Catalan", "key": "ca"},
                ],
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=9,
    )
    def test_query_courses_terms_has_no_more_values_edge_case(self, *_):
        """
        Edge case: we ask for N values and get back M where applicable limit < M < N.
        This is a case where there are *no* more values because all of the values beyond
        the applicable limit are in our `subjects`.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?scope=filters"
                f"&subjects={data['subjects'][9].get_es_id()}"
                f"&subjects={data['subjects'][10].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": False,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Computer science",
                        "key": data["subjects"][7].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Education and career guidance",
                        "key": data["subjects"][9].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Entrepreneurship",
                        "key": data["subjects"][6].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Health",
                        "key": data["subjects"][10].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Languages",
                        "key": data["subjects"][8].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Management",
                        "key": data["subjects"][5].get_es_id(),
                    },
                ],
            },
        )

    @mock.patch(
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=9,
    )
    def test_query_courses_manual_has_no_more_values_edge_case(self, *_):
        """
        Edge case: we ask for N values and get back M where applicable limit < M < N.
        This is a case where there are *no* more values because all of the values beyond
        the applicable limit are in our `languages` filter.
        """
        self.prepare_indices()
        response = self.client.get(
            "/api/v1.0/courses/?scope=filters&languages=be&languages=ca"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": False,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                    {"count": 1, "human_name": "Belarusian", "key": "be"},
                    {"count": 1, "human_name": "Bengali", "key": "bn"},
                    {"count": 1, "human_name": "Bosnian", "key": "bs"},
                    {"count": 1, "human_name": "Breton", "key": "br"},
                    {"count": 1, "human_name": "Bulgarian", "key": "bg"},
                    {"count": 1, "human_name": "Catalan", "key": "ca"},
                ],
            },
        )

    @mock.patch.dict(  # Increase min_doc_count for subjects to 2
        FILTERS,
        {
            "subjects": IndexableHierarchicalFilterDefinition(
                "subjects",
                **{**FILTERS_CONFIGURATION["subjects"]["params"], "min_doc_count": 2},
            )
        },
    )
    def test_query_courses_terms_active_values_min_doc_count(self, *_):
        """
        Active values are returned for the subjects filter (based on ES terms) regardless
        of `min_doc_count`. Other values below the `min_doc_count` are not returned.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?scope=filters&subjects="
                f"{data['subjects'][10].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": "Health",
                        "key": data["subjects"][10].get_es_id(),
                    },
                ],
            },
        )

    @mock.patch.dict(  # Increase min_doc_count for subjects to 2
        FILTERS,
        {
            "subjects": IndexableHierarchicalFilterDefinition(
                "subjects",
                **{**FILTERS_CONFIGURATION["subjects"]["params"], "min_doc_count": 2},
            )
        },
    )
    @mock.patch(  # Increase default facet limit to 15
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=15,
    )
    def test_query_courses_terms_min_doc_count_has_more_values(self, *_):
        """
        Make sure the interaction between facet limit and `min_doc_count` results
        in the expected response. In this instance, we would not have more values
        *if* `min_doc_count` was 0 because we would get all 11 subjects.
        As `min_doc_count` is 2, we only get 5 subjects, and there are thus more values.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "has_more_values": True,
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "values": [
                    {
                        "count": 2,
                        "human_name": "Economy and Finance",
                        "key": data["subjects"][3].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Education and Training",
                        "key": data["subjects"][4].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Human and social sciences",
                        "key": data["subjects"][1].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Law",
                        "key": data["subjects"][2].get_es_id(),
                    },
                    {
                        "count": 2,
                        "human_name": "Science",
                        "key": data["subjects"][0].get_es_id(),
                    },
                ],
            },
        )

    @mock.patch.dict(  # Increase min_doc_count for languages to 2
        FILTERS,
        {
            "course_runs": NestingWrapper(
                "course_runs",
                filters={
                    "languages": {
                        "class": "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                        "params": {
                            "human_name": "Languages",
                            "min_doc_count": 2,
                            "sorting": "count",
                        },
                    }
                },
            )
        },
    )
    def test_query_courses_manual_active_values_min_doc_count(self, *_):
        """
        Active values are returned for the languages filter (based on manual aggregations)
        regardless of `min_doc_count`. Other values below the `min_doc_count` are not returned.
        """
        self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters&languages=ca")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": True,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                    {"count": 1, "human_name": "Catalan", "key": "ca"},
                ],
            },
        )

    @mock.patch.dict(  # Increase min_doc_count for languages to 2
        FILTERS,
        {
            "course_runs": NestingWrapper(
                "course_runs",
                filters={
                    "languages": {
                        "class": "richie.apps.search.filter_definitions.LanguagesFilterDefinition",
                        "params": {
                            "human_name": "Languages",
                            "min_doc_count": 2,
                            "sorting": "count",
                        },
                    },
                },
            )
        },
    )
    @mock.patch(  # Increase default facet limit to 15
        "richie.apps.search.filter_definitions.helpers.FACET_COUNTS_DEFAULT_LIMIT",
        new=15,
    )
    def test_query_courses_manuel_min_doc_count_has_more_values(self, *_):
        """
        Make sure the interaction between facet limit and `min_doc_count` results
        in the expected response. In this instance, we would not have more values
        *if* `min_doc_count` was 0 because we would get all 11 languages.
        As `min_doc_count` is 2, we only get 5 languages, and there are thus more values.
        """
        self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["languages"],
            {
                "base_path": None,
                "has_more_values": True,
                "human_name": "Languages",
                "is_autocompletable": False,
                "is_drilldown": False,
                "is_searchable": False,
                "name": "languages",
                "position": 5,
                "values": [
                    {"count": 2, "human_name": "Afrikaans", "key": "af"},
                    {"count": 2, "human_name": "Algerian Arabic", "key": "ar-dz"},
                    {"count": 2, "human_name": "Arabic", "key": "ar"},
                    {"count": 2, "human_name": "Asturian", "key": "ast"},
                    {"count": 2, "human_name": "Azerbaijani", "key": "az"},
                ],
            },
        )
