"""Integration tests for actual search results and their ordering."""

# pylint: disable=too-many-lines
import random
from unittest import mock

from django.core.cache import caches
from django.test import TestCase

import arrow
from cms.models import Page

from richie.apps.courses.factories import (
    CategoryFactory,
    LicenceFactory,
    OrganizationFactory,
    PersonFactory,
)
from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.filter_definitions import FILTERS
from richie.apps.search.filter_definitions.courses import ALL_LANGUAGES_DICT
from richie.apps.search.indexers.categories import CategoriesIndexer
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.licences import LicencesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.indexers.persons import PersonsIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS


# pylint: disable=too-many-public-methods
@mock.patch.dict(  # Reduce the number of languages
    ALL_LANGUAGES_DICT,
    {"fr": "#fr", "en": "#en", "de": "#de"},
    clear=True,
)
@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    CoursesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_courses",
)
class CourseRunsCoursesQueryTestCase(TestCase):
    """
    Test search queries on courses and underlying course runs to make sure filtering and sorting
    works as expected.
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
    def create_filter_pages():
        """Create pages for each filter based on an indexable."""
        return {
            "subjects": CategoryFactory(
                page_reverse_id="subjects", page_title="Subjects", should_publish=True
            ),
            "levels": CategoryFactory(
                page_reverse_id="levels", page_title="Levels", should_publish=True
            ),
            "organizations": OrganizationFactory(
                page_reverse_id="organizations",
                page_title="Organizations",
                should_publish=True,
            ),
        }

    @staticmethod
    def get_expected_courses(courses_definition, course_run_ids):
        """
        Compute the expected course ids from the course run ids.
        """
        # Remove courses that don't have archived course runs
        # > [[3, ["I", "E"]], [2, ["H", "F"]]]
        filtered_courses = list(
            filter(
                lambda o: any((id in course_run_ids for id in o[1])), courses_definition
            )
        )

        # Sort our courses according to the ranking of their open course runs:
        # > [[2, ["H", "F"]], [3, ["I", "E"]]]
        # Note that we only consider open course runs to sort our courses otherwise
        # some better course runs could make it incoherent. In our example, the "D"
        # course run, if taken into account, would have lead to the following sequence
        # which is not what we expect:
        #   [[2, ["I", "E"]], [3, ["H", "F"]]]
        sorted_courses = sorted(
            filtered_courses,
            key=lambda o: min(
                course_run_ids.index(id) for id in o[1] if id in course_run_ids
            ),
        )

        # Extract the expected list of courses
        # > [1, 3, 0]
        return list(list(zip(*sorted_courses))[0])

    def prepare_indices(self, suite=None):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class:
        - create relevant objects that will be linked with courses,
        - generate a set of courses randomly associated to our "interesting" course runs,
        - prepare the Elasticsearch index.
        """
        # pylint: disable=too-many-locals
        now = arrow.utcnow()
        filter_pages = self.create_filter_pages()

        top_subjects = [
            CategoryFactory(
                page_parent=filter_pages["subjects"].extended_object,
                page_title=f"Subject #{i}",
                should_publish=True,
            )
            for i in range(0, 4)
        ]

        subject_0_children = [
            CategoryFactory(
                page_parent=top_subjects[0].extended_object,
                page_title=f"Subject #0 Child #{i}",
                should_publish=True,
            )
            for i in range(0, 2)
        ]

        subject_1_children = [
            CategoryFactory(
                page_parent=top_subjects[1].extended_object,
                page_title=f"Subject #1 Child #{i}",
                should_publish=True,
            )
            for i in range(0, 2)
        ]

        levels = [
            CategoryFactory(
                page_parent=filter_pages["levels"].extended_object,
                page_title=f"Level #{i}",
                should_publish=True,
            )
            for i in range(0, 3)
        ]

        licences = [
            LicenceFactory(),
            LicenceFactory(name="CC-BY-NC"),
            LicenceFactory(name="CC-BY-SA"),
        ]

        top_organizations = [
            OrganizationFactory(
                page_parent=filter_pages["organizations"].extended_object,
                page_title=f"Organization #{i}",
                should_publish=True,
            )
            for i in range(0, 4)
        ]

        organization_0_children = [
            OrganizationFactory(
                page_parent=top_organizations[0].extended_object,
                page_title=f"Organization #0 Child #{i}",
                should_publish=True,
            )
            for i in range(0, 2)
        ]

        organization_1_children = [
            OrganizationFactory(
                page_parent=top_organizations[1].extended_object,
                page_title=f"Organization #1 Child #{i}",
                should_publish=True,
            )
            for i in range(0, 2)
        ]

        persons = [
            PersonFactory(
                page_title="Mikhaïl Boulgakov",
                should_publish=True,
            )
        ]

        # NB: Indexed human names do not match the actual titles for the pages.
        # This makes it simpler to run full-text searches and check their results.
        courses = [
            {
                "categories": [
                    cat.get_es_id()
                    for cat in [
                        top_subjects[0],
                        top_subjects[1],
                        subject_0_children[0],
                        levels[0],
                    ]
                ],
                "categories_names": {
                    "en": ["Artificial intelligence", "Autumn", "Wilderness"]
                },
                "code": "001abc",
                "description": {
                    "en": (
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec "
                        "egestas lectus. Cras eget lobortis eros. Suspendisse hendrerit dictum "
                        "ex, eget pharetra. Pellentesque habitant morbi tristique senectus et "
                        "netus et malesuada fames ac turpis egestas. Integer ut eleifend massa."
                    )
                },
                "introduction": {"en": "Polarized non-volatile structure"},
                "is_new": True,
                "is_listed": True,
                "licences": [licences[0].id],
                "organization_highlighted": {"en": "Org 311"},
                "organizations": [
                    org.get_es_id()
                    for org in [
                        top_organizations[0],
                        top_organizations[3],
                        organization_0_children[0],
                    ]
                ],
                "organizations_names": {"en": ["Org 31", "Org 34", "Org 311"]},
                "persons": [persons[0].get_es_id()],
                "persons_names": {"en": ["Mikhaïl Boulgakov"]},
                "pace": 15,
                "title": {"en": "Artificial intelligence for mushroom picking"},
            },
            {
                "categories": [
                    cat.get_es_id()
                    for cat in [
                        top_subjects[0],
                        top_subjects[2],
                        subject_0_children[1],
                        levels[2],
                    ]
                ],
                "categories_names": {"en": ["Martial arts?", "Autumn"]},
                "code": "002lmn",
                "description": {
                    "en": (
                        "Artisanally-sourced clicks neque. erat volutpat. Nulla at laoreet. "
                        "Finibus viverra tortor et pulvinar. In placerat interdum arcu, ac "
                        "ullamcorper augue. Nam sed semper velit. Praesent orci nulla, malesuada "
                        "nec commodo at, lobortis eget justo."
                    )
                },
                "introduction": {"en": "De-engineered demand-driven success"},
                "is_new": True,
                "is_listed": True,
                "licences": [licences[0].id],
                "organization_highlighted": {"en": "Org 33"},
                "organization_highlighted_cover_image": {},
                "organizations": [
                    org.get_es_id()
                    for org in [
                        top_organizations[0],
                        top_organizations[2],
                        organization_0_children[1],
                    ]
                ],
                "organizations_names": {"en": ["Org 31", "Org 33", "Org 312"]},
                "persons": [],
                "persons_names": {},
                "pace": 90,
                "title": {"en": "Click-farms: managing the autumn harvest"},
            },
            {
                "categories": [
                    cat.get_es_id()
                    for cat in [
                        top_subjects[1],
                        top_subjects[2],
                        subject_1_children[0],
                        levels[0],
                    ]
                ],
                "categories_names": {
                    "en": ["Artificial intelligence", "Water", "Wilderness"]
                },
                "code": "003rst",
                "description": {
                    "en": (
                        "Cursus honorum finite que non luctus ante. Etiam accumsan vulputate "
                        "magna non sollicitudin. Aliquam molestie est finibus elit scelerisque "
                        "laoreet. Maecenas porttitor cursus cursus. Nam pellentesque eget neque "
                        "quis tincidunt. Fusce sem ipsum, dignissim at augue."
                    )
                },
                "introduction": {"en": "Up-sized value-added project"},
                "is_new": False,
                "is_listed": True,
                "licences": [licences[1].id],
                "organization_highlighted": {"en": "Org 321"},
                "organizations": [
                    org.get_es_id()
                    for org in [
                        top_organizations[1],
                        top_organizations[2],
                        organization_1_children[0],
                    ]
                ],
                "organizations_names": {"en": ["Org 32", "Org 33", "Org 321"]},
                "persons": [],
                "persons_names": {},
                "pace": 180,
                "title": {"en": "Building a data lake out of mountain springs"},
            },
            {
                "categories": [
                    cat.get_es_id()
                    for cat in [
                        top_subjects[1],
                        top_subjects[3],
                        subject_1_children[1],
                        levels[1],
                    ]
                ],
                "categories_names": {"en": ["Martial arts?", "Water"]},
                "code": "004xyz",
                "description": {
                    "en": (
                        "Nullam ornare finibus sollicitudin. Aliquam nisl leo, vestibulum a "
                        "turpis quis, convallis tincidunt sem. Aliquam eleifend tellus vitae "
                        "neque sagittis rutrum. Artificial vulputate neque placerat, commodo "
                        "quam gravida, maximus lectus."
                    )
                },
                "introduction": {"en": "Innovative encompassing extranet"},
                "is_new": False,
                "is_listed": True,
                "licences": [licences[2].id],
                "organization_highlighted": {"en": "Org 34"},
                "organizations": [
                    org.get_es_id()
                    for org in [
                        top_organizations[1],
                        top_organizations[3],
                        organization_1_children[1],
                    ]
                ],
                "organizations_names": {"en": ["Org 32", "Org 34", "Org 322"]},
                "persons": [persons[0].get_es_id()],
                "persons_names": {"en": ["Mikhaïl Boulgakov"]},
                "pace": None,
                "title": {"en": "Kung-fu moves for cloud infrastructure security"},
            },
        ]
        course_runs = {
            "A": {
                # A) ongoing course, next open course to end enrollment
                "start": now.shift(days=-5).datetime,
                "end": now.shift(days=+120).datetime,
                "enrollment_start": now.shift(days=-15).datetime,
                "enrollment_end": now.shift(days=+5).datetime,
                "languages": ["fr"],
            },
            "B": {
                # B) ongoing course, can still be enrolled in for longer than A)
                "start": now.shift(days=-15).datetime,
                "end": now.shift(days=+105).datetime,
                "enrollment_start": now.shift(days=-30).datetime,
                "enrollment_end": now.shift(days=+15).datetime,
                "languages": ["en"],
            },
            "C": {
                # C) not started yet, first upcoming course to start
                "start": now.shift(days=+15).datetime,
                "end": now.shift(days=+150).datetime,
                "enrollment_start": now.shift(days=-30).datetime,
                "enrollment_end": now.shift(days=+30).datetime,
                "languages": ["en"],
            },
            "D": {
                # D) already finished course but enrollment still open
                "start": now.shift(days=-80).datetime,
                "end": now.shift(days=-15).datetime,
                "enrollment_start": now.shift(days=-100).datetime,
                "enrollment_end": now.shift(days=+15).datetime,
                "languages": ["en"],
            },
            "E": {
                # E) not started yet, will start after the other upcoming course
                "start": now.shift(days=+45).datetime,
                "end": now.shift(days=+120).datetime,
                "enrollment_start": now.shift(days=+30).datetime,
                "enrollment_end": now.shift(days=+60).datetime,
                "languages": ["fr", "de"],
            },
            "F": {
                # F) ongoing course, most recent to end enrollment
                "start": now.shift(days=-90).datetime,
                "end": now.shift(days=+15).datetime,
                "enrollment_start": now.shift(days=-120).datetime,
                "enrollment_end": now.shift(days=-30).datetime,
                "languages": ["en"],
            },
            "G": {
                # G) ongoing course, enrollment has been over for the longest
                "start": now.shift(days=-75).datetime,
                "end": now.shift(days=+30).datetime,
                "enrollment_start": now.shift(days=-100).datetime,
                "enrollment_end": now.shift(days=-45).datetime,
                "languages": ["fr"],
            },
            "H": {
                # H) already finished course; it finished more recently than I)
                "start": now.shift(days=-80).datetime,
                "end": now.shift(days=-15).datetime,
                "enrollment_start": now.shift(days=-100).datetime,
                "enrollment_end": now.shift(days=-60).datetime,
                "languages": ["en"],
            },
            "I": {
                # I) the course that has been over for the longest
                "start": now.shift(days=-120).datetime,
                "end": now.shift(days=-30).datetime,
                "enrollment_start": now.shift(days=-150).datetime,
                "enrollment_end": now.shift(days=-90).datetime,
                "languages": ["en", "de"],
            },
        }

        # Shuffle and group our course runs to assign them randomly to 4 courses
        # For example: [["I", "E", "C"], ["D", "G"], ["B", "A"], ["H", "F"]]
        if not suite:
            shuffled_runs = random.sample(list(course_runs), len(course_runs))
            suite = [shuffled_runs[i::4] for i in range(4)]

        # Associate groups of course runs to each course
        # > [[3, ["I", "E", "C"]], [0, ["D", "G"]], [1, ["B", "A"]], [2, ["H", "F"]]]
        self.assertEqual(len(suite), 4)
        courses_definition = [[i, suite[i]] for i in range(4)]

        # Delete any existing indices so we get a clean slate
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

        # Create an index for our organizations
        ES_INDICES_CLIENT.create(index="richie_organizations")
        ES_INDICES_CLIENT.close(index="richie_organizations")
        ES_INDICES_CLIENT.put_settings(
            body=ANALYSIS_SETTINGS, index="richie_organizations"
        )
        ES_INDICES_CLIENT.open(index="richie_organizations")
        ES_INDICES_CLIENT.put_mapping(
            body=OrganizationsIndexer.mapping, index="richie_organizations"
        )

        # Create an index for our persons
        ES_INDICES_CLIENT.create(index="richie_persons")
        ES_INDICES_CLIENT.close(index="richie_persons")
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="richie_persons")
        ES_INDICES_CLIENT.open(index="richie_persons")
        ES_INDICES_CLIENT.put_mapping(
            body=PersonsIndexer.mapping, index="richie_persons"
        )

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

        # Actually insert our courses in the index
        actions = (
            [
                CategoriesIndexer.get_es_document_for_category(
                    category.public_extension
                )
                for category in top_subjects
                + subject_0_children
                + subject_1_children
                + levels
            ]
            + [
                OrganizationsIndexer.get_es_document_for_organization(
                    organization.public_extension
                )
                for organization in top_organizations
                + organization_0_children
                + organization_1_children
            ]
            + [
                PersonsIndexer.get_es_document_for_person(person.public_extension)
                for person in persons
            ]
            + [
                LicencesIndexer.get_es_document_for_licence(licence)
                for licence in licences
            ]
            + [
                {
                    "_id": course_id,
                    "_index": "test_courses",
                    "_op_type": "create",
                    # The sorting algorithm assumes that course runs are sorted by decreasing
                    # end date in order to limit the number of iterations and courses with a
                    # lot of archived courses.
                    "absolute_url": {"en": "url"},
                    "cover_image": {"en": "cover_image.jpg"},
                    "duration": {"en": "N/A"},
                    "effort": {"en": "N/A"},
                    "icon": {"en": "icon.jpg"},
                    "title": {"en": "title"},
                    **courses[course_id],
                    "course_runs": sorted(
                        [
                            # Each course randomly gets course runs (thanks to above shuffle)
                            course_runs[course_run_id]
                            for course_run_id in course_run_ids
                        ],
                        key=lambda o: now - o["end"],
                    ),
                }
                for course_id, course_run_ids in courses_definition
            ]
        )
        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

        return {
            "course_runs": course_runs,
            "courses_definition": courses_definition,
            "top_subjects": top_subjects,
            "subject_0_children": subject_0_children,
            "subject_1_children": subject_1_children,
            "levels": levels,
            "licences": licences,
            "top_organizations": top_organizations,
            "organization_0_children": organization_0_children,
            "organization_1_children": organization_1_children,
            "persons": persons,
        }

    @mock.patch.object(arrow, "utcnow", return_value=arrow.get(2020, 2, 9))
    def test_query_courses_match_all_general(self, *_):
        """
        Validate the detailed format of the response to a match all query.
        We force the suite to a precise example because the facet count may vary if for example
        the two course runs in german end-up on the same course (in this case the facet count
        should be 1. See next test).
        """
        data = self.prepare_indices(
            suite=[["A", "E"], ["H", "G"], ["B", "I"], ["C", "F"]],
        )
        response = self.client.get("/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "meta": {"count": 4, "offset": 0, "total_count": 4},
                "objects": [
                    {
                        "id": "0",
                        "absolute_url": "url",
                        "categories": [
                            cat.get_es_id()
                            for cat in [
                                data["top_subjects"][0],
                                data["top_subjects"][1],
                                data["subject_0_children"][0],
                                data["levels"][0],
                            ]
                        ],
                        "code": "001abc",
                        "course_runs": [
                            {
                                "end": "2020-06-08T00:00:00+00:00",
                                "enrollment_end": "2020-02-14T00:00:00+00:00",
                                "enrollment_start": "2020-01-25T00:00:00+00:00",
                                "languages": ["fr"],
                                "start": "2020-02-04T00:00:00+00:00",
                            },
                            {
                                "end": "2020-06-08T00:00:00+00:00",
                                "enrollment_end": "2020-04-09T00:00:00+00:00",
                                "enrollment_start": "2020-03-10T00:00:00+00:00",
                                "languages": ["fr", "de"],
                                "start": "2020-03-25T00:00:00+00:00",
                            },
                        ],
                        "cover_image": "cover_image.jpg",
                        "duration": "N/A",
                        "effort": "N/A",
                        "icon": "icon.jpg",
                        "introduction": "Polarized non-volatile structure",
                        "organization_highlighted": "Org 311",
                        "organization_highlighted_cover_image": None,
                        "organizations": [
                            org.get_es_id()
                            for org in [
                                data["top_organizations"][0],
                                data["top_organizations"][3],
                                data["organization_0_children"][0],
                            ]
                        ],
                        "state": {
                            "priority": 0,
                            "call_to_action": "enroll now",
                            "datetime": None,
                            "text": "open for enrollment",
                        },
                        "title": "Artificial intelligence for mushroom picking",
                    },
                    {
                        "id": "2",
                        "absolute_url": "url",
                        "categories": [
                            cat.get_es_id()
                            for cat in [
                                data["top_subjects"][1],
                                data["top_subjects"][2],
                                data["subject_1_children"][0],
                                data["levels"][0],
                            ]
                        ],
                        "code": "003rst",
                        "course_runs": [
                            {
                                "end": "2020-05-24T00:00:00+00:00",
                                "enrollment_end": "2020-02-24T00:00:00+00:00",
                                "enrollment_start": "2020-01-10T00:00:00+00:00",
                                "languages": ["en"],
                                "start": "2020-01-25T00:00:00+00:00",
                            },
                            {
                                "end": "2020-01-10T00:00:00+00:00",
                                "enrollment_end": "2019-11-11T00:00:00+00:00",
                                "enrollment_start": "2019-09-12T00:00:00+00:00",
                                "languages": ["en", "de"],
                                "start": "2019-10-12T00:00:00+00:00",
                            },
                        ],
                        "cover_image": "cover_image.jpg",
                        "duration": "N/A",
                        "effort": "N/A",
                        "icon": "icon.jpg",
                        "introduction": "Up-sized value-added project",
                        "organization_highlighted": "Org 321",
                        "organization_highlighted_cover_image": None,
                        "organizations": [
                            org.get_es_id()
                            for org in [
                                data["top_organizations"][1],
                                data["top_organizations"][2],
                                data["organization_1_children"][0],
                            ]
                        ],
                        "state": {
                            "priority": 0,
                            "datetime": None,
                            "call_to_action": "enroll now",
                            "text": "open for enrollment",
                        },
                        "title": "Building a data lake out of mountain springs",
                    },
                    {
                        "id": "3",
                        "absolute_url": "url",
                        "categories": [
                            cat.get_es_id()
                            for cat in [
                                data["top_subjects"][1],
                                data["top_subjects"][3],
                                data["subject_1_children"][1],
                                data["levels"][1],
                            ]
                        ],
                        "code": "004xyz",
                        "course_runs": [
                            {
                                "end": "2020-07-08T00:00:00+00:00",
                                "enrollment_end": "2020-03-10T00:00:00+00:00",
                                "enrollment_start": "2020-01-10T00:00:00+00:00",
                                "languages": ["en"],
                                "start": "2020-02-24T00:00:00+00:00",
                            },
                            {
                                "end": "2020-02-24T00:00:00+00:00",
                                "enrollment_end": "2020-01-10T00:00:00+00:00",
                                "enrollment_start": "2019-10-12T00:00:00+00:00",
                                "languages": ["en"],
                                "start": "2019-11-11T00:00:00+00:00",
                            },
                        ],
                        "cover_image": "cover_image.jpg",
                        "duration": "N/A",
                        "effort": "N/A",
                        "icon": "icon.jpg",
                        "introduction": "Innovative encompassing extranet",
                        "organization_highlighted": "Org 34",
                        "organization_highlighted_cover_image": None,
                        "organizations": [
                            org.get_es_id()
                            for org in [
                                data["top_organizations"][1],
                                data["top_organizations"][3],
                                data["organization_1_children"][1],
                            ]
                        ],
                        "state": {
                            "priority": 1,
                            "datetime": data["course_runs"]["C"]["start"]
                            .isoformat()
                            .replace("+00:00", "Z"),
                            "call_to_action": "enroll now",
                            "text": "starting on",
                        },
                        "title": "Kung-fu moves for cloud infrastructure security",
                    },
                    {
                        "id": "1",
                        "absolute_url": "url",
                        "categories": [
                            cat.get_es_id()
                            for cat in [
                                data["top_subjects"][0],
                                data["top_subjects"][2],
                                data["subject_0_children"][1],
                                data["levels"][2],
                            ]
                        ],
                        "code": "002lmn",
                        "course_runs": [
                            {
                                "end": "2020-03-10T00:00:00+00:00",
                                "enrollment_end": "2019-12-26T00:00:00+00:00",
                                "enrollment_start": "2019-11-01T00:00:00+00:00",
                                "languages": ["fr"],
                                "start": "2019-11-26T00:00:00+00:00",
                            },
                            {
                                "end": "2020-01-25T00:00:00+00:00",
                                "enrollment_end": "2019-12-11T00:00:00+00:00",
                                "enrollment_start": "2019-11-01T00:00:00+00:00",
                                "languages": ["en"],
                                "start": "2019-11-21T00:00:00+00:00",
                            },
                        ],
                        "cover_image": "cover_image.jpg",
                        "duration": "N/A",
                        "effort": "N/A",
                        "icon": "icon.jpg",
                        "introduction": "De-engineered demand-driven success",
                        "organization_highlighted": "Org 33",
                        "organization_highlighted_cover_image": None,
                        "organizations": [
                            org.get_es_id()
                            for org in [
                                data["top_organizations"][0],
                                data["top_organizations"][2],
                                data["organization_0_children"][1],
                            ]
                        ],
                        "state": {
                            "priority": 5,
                            "datetime": None,
                            "call_to_action": None,
                            "text": "on-going",
                        },
                        "title": "Click-farms: managing the autumn harvest",
                    },
                ],
                "filters": {
                    "availability": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Availability",
                        "is_autocompletable": False,
                        "is_drilldown": True,
                        "is_searchable": False,
                        "name": "availability",
                        "position": 1,
                        "values": [
                            {
                                "count": 3,
                                "human_name": "Open for enrollment",
                                "key": "open",
                            },
                            {
                                "count": 2,
                                "human_name": "Coming soon",
                                "key": "coming_soon",
                            },
                            {"count": 4, "human_name": "On-going", "key": "ongoing"},
                            {"count": 2, "human_name": "Archived", "key": "archived"},
                        ],
                    },
                    "languages": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Languages",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "languages",
                        "position": 5,
                        "values": [
                            {"count": 3, "human_name": "#en", "key": "en"},
                            {"count": 2, "human_name": "#de", "key": "de"},
                            {"count": 2, "human_name": "#fr", "key": "fr"},
                        ],
                    },
                    "levels": {
                        "base_path": "0002",
                        "has_more_values": False,
                        "human_name": "Levels",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "levels",
                        "position": 3,
                        "values": [
                            {
                                "count": 2,
                                "human_name": "Level #0",
                                "key": data["levels"][0].get_es_id(),
                            },
                            {
                                "count": 1,
                                "human_name": "Level #1",
                                "key": data["levels"][1].get_es_id(),
                            },
                            {
                                "count": 1,
                                "human_name": "Level #2",
                                "key": data["levels"][2].get_es_id(),
                            },
                        ],
                    },
                    "licences": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Licences",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "licences",
                        "position": 7,
                        "values": [
                            {
                                "count": 2,
                                "human_name": data["licences"][0].name,
                                "key": str(data["licences"][0].id),
                            },
                            {
                                "count": 1,
                                "human_name": data["licences"][1].name,
                                "key": str(data["licences"][1].id),
                            },
                            {
                                "count": 1,
                                "human_name": data["licences"][2].name,
                                "key": str(data["licences"][2].id),
                            },
                        ],
                    },
                    "new": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "New courses",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "new",
                        "position": 0,
                        "values": [
                            {"count": 2, "human_name": "First session", "key": "new"}
                        ],
                    },
                    "organizations": {
                        "base_path": "0003",
                        "has_more_values": False,
                        "human_name": "Organizations",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "organizations",
                        "position": 4,
                        "values": [
                            {
                                "count": 2,
                                "human_name": "Organization #0",
                                "key": data["top_organizations"][0].get_es_id(),
                            },
                            {
                                "count": 2,
                                "human_name": "Organization #1",
                                "key": data["top_organizations"][1].get_es_id(),
                            },
                            {
                                "count": 2,
                                "human_name": "Organization #2",
                                "key": data["top_organizations"][2].get_es_id(),
                            },
                            {
                                "count": 2,
                                "human_name": "Organization #3",
                                "key": data["top_organizations"][3].get_es_id(),
                            },
                        ],
                    },
                    "persons": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Persons",
                        "is_autocompletable": True,
                        "is_drilldown": False,
                        "is_searchable": True,
                        "name": "persons",
                        "position": 6,
                        "values": [
                            {
                                "count": 2,
                                "human_name": "Mikhaïl Boulgakov",
                                "key": data["persons"][0].get_es_id(),
                            }
                        ],
                    },
                    "pace": {
                        "base_path": None,
                        "has_more_values": False,
                        "human_name": "Weekly pace",
                        "is_autocompletable": False,
                        "is_drilldown": False,
                        "is_searchable": False,
                        "name": "pace",
                        "position": 8,
                        "values": [
                            {
                                "count": 1,
                                "human_name": "Self-paced",
                                "key": "self-paced",
                            },
                            {
                                "count": 1,
                                "human_name": "Less than one hour",
                                "key": "lt-1h",
                            },
                            {
                                "count": 1,
                                "human_name": "One to two hours",
                                "key": "1h-2h",
                            },
                            {
                                "count": 1,
                                "human_name": "More than two hours",
                                "key": "gt-2h",
                            },
                        ],
                    },
                    "subjects": {
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
                                "count": 3,
                                "human_name": "Subject #1",
                                "key": data["top_subjects"][1].get_es_id(),
                            },
                            {
                                "count": 2,
                                "human_name": "Subject #0",
                                "key": data["top_subjects"][0].get_es_id(),
                            },
                            {
                                "count": 2,
                                "human_name": "Subject #2",
                                "key": data["top_subjects"][2].get_es_id(),
                            },
                            {
                                "count": 1,
                                "human_name": "Subject #3",
                                "key": data["top_subjects"][3].get_es_id(),
                            },
                        ],
                    },
                },
            },
        )

    def test_query_courses_match_all_grouped_course_runs(self, *_):
        """
        This test examines edge cases of the previous test which lead to different facet counts:
        - A/B and E/F course runs grouped under the same course:
          => 2 ongoing courses instead of 4
        - D/H course runs grouped under the same course:
          => 1 german course instead of 2
        """
        data = self.prepare_indices(
            suite=[["A", "B"], ["H", "C"], ["E", "I"], ["G", "F"]]
        )
        response = self.client.get("/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((o["state"] for o in response.json()["objects"])),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": None,
                    "priority": 0,
                    "text": "open for enrollment",
                },
                {
                    "call_to_action": "enroll now",
                    "datetime": data["course_runs"]["C"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 1,
                    "text": "starting on",
                },
                {
                    "call_to_action": None,
                    "datetime": data["course_runs"]["E"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 3,
                    "text": "starting on",
                },
                {
                    "call_to_action": None,
                    "datetime": None,
                    "priority": 5,
                    "text": "on-going",
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["languages"]["values"],
            [
                {"count": 4, "human_name": "#en", "key": "en"},
                {"count": 3, "human_name": "#fr", "key": "fr"},
                {"count": 1, "human_name": "#de", "key": "de"},
            ],
        )
        self.assertEqual(
            response.json()["filters"]["availability"]["values"],
            [
                {"count": 2, "human_name": "Open for enrollment", "key": "open"},
                {"count": 2, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 2, "human_name": "Archived", "key": "archived"},
            ],
        )

    def test_query_courses_course_runs_filter_open_courses(self, *_):
        """
        Battle test filtering and sorting open courses.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?availability=open")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(data["courses_definition"], ["A", "B", "C", "D"]),
        )

    def test_query_courses_match_all_scope_objects(self, *_):
        """
        The scope can be limited to objects via the querystring.
        """
        self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=objects")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["objects"]), 4)
        self.assertFalse("filters" in response.json())

    def test_query_courses_match_all_scope_filters(self, *_):
        """
        The scope can be limited to filters via the querystring.
        """
        self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["filters"]), 9)
        self.assertFalse("objects" in response.json())

    def test_query_courses_course_runs_filter_availability_facets(self, *_):
        """
        Check that facet counts are affected on languages but not on availability
        when we filter on availability.
        We must fix the course runs suite because facet counts may vary if course
        runs with the same language (resp. availability) get grouped under the same
        course.
        """
        data = self.prepare_indices(
            suite=[["A", "B"], ["H", "C"], ["E", "I"], ["G", "F"]]
        )
        response = self.client.get("/api/v1.0/courses/?availability=open")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((o["state"] for o in response.json()["objects"])),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": None,
                    "priority": 0,
                    "text": "open for enrollment",
                },
                {
                    "call_to_action": "enroll now",
                    "datetime": data["course_runs"]["C"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 1,
                    "text": "starting on",
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["languages"]["values"],
            [
                {"count": 2, "human_name": "#en", "key": "en"},
                {"count": 1, "human_name": "#fr", "key": "fr"},
            ],
        )
        self.assertEqual(
            response.json()["filters"]["availability"]["values"],
            [
                {"count": 2, "human_name": "Open for enrollment", "key": "open"},
                {"count": 2, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 2, "human_name": "Archived", "key": "archived"},
            ],
        )
        self.assertEqual(
            response.json()["filters"]["subjects"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Subject #0",
                    "key": data["top_subjects"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #1",
                    "key": data["top_subjects"][1].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #2",
                    "key": data["top_subjects"][2].get_es_id(),
                },
                {
                    "count": 0,
                    "human_name": "Subject #3",
                    "key": data["top_subjects"][3].get_es_id(),
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["levels"]["values"],
            [
                {
                    "count": 1,
                    "human_name": "Level #0",
                    "key": data["levels"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Level #2",
                    "key": data["levels"][2].get_es_id(),
                },
                {
                    "count": 0,
                    "human_name": "Level #1",
                    "key": data["levels"][1].get_es_id(),
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["organizations"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Organization #0",
                    "key": data["top_organizations"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #2",
                    "key": data["top_organizations"][2].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #3",
                    "key": data["top_organizations"][3].get_es_id(),
                },
                {
                    "count": 0,
                    "human_name": "Organization #1",
                    "key": data["top_organizations"][1].get_es_id(),
                },
            ],
        )

    def test_query_courses_course_runs_filter_ongoing_courses(self, *_):
        """
        Battle test filtering and sorting ongoing courses.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?availability=ongoing")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(data["courses_definition"], ["A", "B", "F", "G"]),
        )

    def test_query_courses_course_runs_filter_coming_soon_courses(self, *_):
        """
        Battle test filtering and sorting coming soon courses.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?availability=coming_soon")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(data["courses_definition"], ["C", "E"]),
        )

    def test_query_courses_course_runs_filter_archived_courses(self, *_):
        """
        Battle test filtering and sorting archived courses.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?availability=archived")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(data["courses_definition"], ["D", "H", "I"]),
        )

    def test_query_courses_course_runs_filter_language(self, *_):
        """
        Battle test filtering and sorting courses in one language.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?languages=fr")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(data["courses_definition"], ["A", "E", "G"]),
        )

    def test_query_courses_course_runs_filter_language_facets(self, *_):
        """
        Check that facet counts are affected on availability but not on languages
        when we filter on languages.
        We must fix the course runs suite because facet counts may vary if course
        runs with the same language (resp. availability) get grouped under the same
        course.
        """
        data = self.prepare_indices(
            suite=[["A", "B"], ["H", "D"], ["E", "I"], ["G", "F"]]
        )
        response = self.client.get("/api/v1.0/courses/?languages=fr")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((o["state"] for o in response.json()["objects"])),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": None,
                    "priority": 0,
                    "text": "open for enrollment",
                },
                {
                    "call_to_action": None,
                    "datetime": data["course_runs"]["E"]["start"]
                    .isoformat()
                    .replace("+00:00", "Z"),
                    "priority": 3,
                    "text": "starting on",
                },
                {
                    "call_to_action": None,
                    "datetime": None,
                    "priority": 5,
                    "text": "on-going",
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["languages"]["values"],
            [
                {"count": 4, "human_name": "#en", "key": "en"},
                {"count": 3, "human_name": "#fr", "key": "fr"},
                {"count": 1, "human_name": "#de", "key": "de"},
            ],
        )
        self.assertEqual(
            response.json()["filters"]["availability"]["values"],
            [
                {"count": 1, "human_name": "Open for enrollment", "key": "open"},
                {"count": 1, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 0, "human_name": "Archived", "key": "archived"},
            ],
        )
        # A, E and G course runs are in French
        # So only courses 0, 2 and 3 are selected
        self.assertEqual(
            response.json()["filters"]["subjects"]["values"],
            [
                {
                    "count": 3,
                    "human_name": "Subject #1",
                    "key": data["top_subjects"][1].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #0",
                    "key": data["top_subjects"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #2",
                    "key": data["top_subjects"][2].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #3",
                    "key": data["top_subjects"][3].get_es_id(),
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["levels"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Level #0",
                    "key": data["levels"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Level #1",
                    "key": data["levels"][1].get_es_id(),
                },
                {
                    "count": 0,
                    "human_name": "Level #2",
                    "key": data["levels"][2].get_es_id(),
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["organizations"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Organization #1",
                    "key": data["top_organizations"][1].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #3",
                    "key": data["top_organizations"][3].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #0",
                    "key": data["top_organizations"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #2",
                    "key": data["top_organizations"][2].get_es_id(),
                },
            ],
        )

    def test_query_courses_course_runs_filter_multiple_languages(self, *_):
        """
        Battle test filtering and sorting courses in several languages.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?languages=fr&languages=de")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(data["courses_definition"], ["A", "E", "G", "I"]),
        )

    def test_query_courses_course_runs_filter_composed(self, *_):
        """
        Battle test filtering and sorting courses on an availability AND a language.
        """
        data = self.prepare_indices()
        response = self.client.get(
            "/api/v1.0/courses/?availability=ongoing&languages=en"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(data["courses_definition"], ["B", "F"]),
        )

    def test_query_courses_course_runs_filter_composed_facets(self, *_):
        """
        Check that facet counts are affected on availability and languages as expected
        when we filter on both languages and availability.
        We must fix the course runs suite because facet counts may vary if course
        runs with the same language (resp. availability) get grouped under the same
        course.
        """
        data = self.prepare_indices(
            suite=[["A", "B"], ["H", "C"], ["E", "I"], ["G", "F"]],
        )
        response = self.client.get(
            "/api/v1.0/courses/?availability=ongoing&languages=en"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list((o["state"] for o in response.json()["objects"])),
            [
                {
                    "call_to_action": "enroll now",
                    "datetime": None,
                    "priority": 0,
                    "text": "open for enrollment",
                },
                {
                    "call_to_action": None,
                    "datetime": None,
                    "priority": 5,
                    "text": "on-going",
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["languages"]["values"],
            [
                {"count": 2, "human_name": "#en", "key": "en"},
                {"count": 2, "human_name": "#fr", "key": "fr"},
            ],
        )
        self.assertEqual(
            response.json()["filters"]["availability"]["values"],
            [
                {"count": 2, "human_name": "Open for enrollment", "key": "open"},
                {"count": 1, "human_name": "Coming soon", "key": "coming_soon"},
                {"count": 2, "human_name": "On-going", "key": "ongoing"},
                {"count": 2, "human_name": "Archived", "key": "archived"},
            ],
        )
        # Only the B and E course runs are on-going and in English
        # So only courses 0 and 3 are selected
        self.assertEqual(
            response.json()["filters"]["subjects"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Subject #1",
                    "key": data["top_subjects"][1].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #0",
                    "key": data["top_subjects"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #3",
                    "key": data["top_subjects"][3].get_es_id(),
                },
                {
                    "count": 0,
                    "human_name": "Subject #2",
                    "key": data["top_subjects"][2].get_es_id(),
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["levels"]["values"],
            [
                {
                    "count": 1,
                    "human_name": "Level #0",
                    "key": data["levels"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Level #1",
                    "key": data["levels"][1].get_es_id(),
                },
                {
                    "count": 0,
                    "human_name": "Level #2",
                    "key": data["levels"][2].get_es_id(),
                },
            ],
        )
        self.assertEqual(
            response.json()["filters"]["organizations"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Organization #3",
                    "key": data["top_organizations"][3].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #0",
                    "key": data["top_organizations"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #1",
                    "key": data["top_organizations"][1].get_es_id(),
                },
                {
                    "count": 0,
                    "human_name": "Organization #2",
                    "key": data["top_organizations"][2].get_es_id(),
                },
            ],
        )

    def test_query_courses_filter_new(self, *_):
        """
        Battle test filtering new courses.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?new=new")
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are new:
        courses_definition = filter(
            lambda c: c[0] in [0, 1], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_pace(self, *_):
        """
        Make sure courses can be filtered by pace.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?pace=1h-2h")
        self.assertEqual(response.status_code, 200)
        courses_definition = filter(lambda c: c[0] == 1, data["courses_definition"])
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_pace_self_paced(self, *_):
        """
        Make sure courses can be filtered to only self-paced.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?pace=self-paced")
        self.assertEqual(response.status_code, 200)
        courses_definition = filter(lambda c: c[0] == 3, data["courses_definition"])
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_licence(self, *_):
        """
        Battle test filtering by a licence.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (f"/api/v1.0/courses/?licences={data['licences'][0].id}")
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to this licence:
        courses_definition = filter(
            lambda c: c[0] in [0, 1], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )
        self.assertEqual(
            response.json()["filters"]["licences"]["values"],
            [
                {
                    "count": 2,
                    "human_name": data["licences"][0].name,
                    "key": str(data["licences"][0].id),
                },
                {
                    "count": 1,
                    "human_name": data["licences"][1].name,
                    "key": str(data["licences"][1].id),
                },
                {
                    "count": 1,
                    "human_name": data["licences"][2].name,
                    "key": str(data["licences"][2].id),
                },
            ],
        )

    def test_query_courses_filter_multiple_licences(self, *_):
        """
        Battle test filtering by multiple licences.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                f"/api/v1.0/courses/?licences={data['licences'][0].id}"
                f"&licences={data['licences'][2].id}"
            )
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to these licences:
        courses_definition = filter(
            lambda c: c[0] in [0, 1, 3], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_licences_aggs(self, *_):
        """
        It should be possible to limit faceting on licences to specific values by
        passing a regex in the querystring.
        """
        data = self.prepare_indices()
        response = self.client.get(
            f"/api/v1.0/courses/?licences_aggs={data['licences'][1].id}"
            f"&licences_aggs={data['licences'][2].id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["licences"]["values"],
            [
                {
                    "count": 1,
                    "human_name": data["licences"][1].name,
                    "key": str(data["licences"][1].id),
                },
                {
                    "count": 1,
                    "human_name": data["licences"][2].name,
                    "key": str(data["licences"][2].id),
                },
            ],
        )

    def test_query_courses_filter_organization(self, *_):
        """
        Battle test filtering by an organization.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?organizations="
                f"{data['top_organizations'][1].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to this organization:
        courses_definition = filter(
            lambda c: c[0] in [2, 3], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )
        self.assertEqual(
            response.json()["filters"]["organizations"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Organization #0",
                    "key": data["top_organizations"][0].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #1",
                    "key": data["top_organizations"][1].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #2",
                    "key": data["top_organizations"][2].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #3",
                    "key": data["top_organizations"][3].get_es_id(),
                },
            ],
        )

    def test_query_courses_filter_multiple_organizations(self, *_):
        """
        Battle test filtering by multiple organizations.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?organizations="
                f"{data['top_organizations'][1].get_es_id()}"
                "&organizations="
                f"{data['organization_0_children'][0].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to these organizations:
        courses_definition = filter(
            lambda c: c[0] in [0, 2, 3], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_organizations_aggs(self, *_):
        """
        It should be possible to limit faceting on an organization to specific values by
        passing a regex in the querystring.
        """
        data = self.prepare_indices()
        response = self.client.get(
            "/api/v1.0/courses/?organizations_aggs="
            f"{data['organization_0_children'][0].get_es_id()}"
            "&organizations_aggs="
            f"{data['organization_0_children'][1].get_es_id()}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["organizations"]["values"],
            [
                {
                    "count": 1,
                    "human_name": "Organization #0 Child #0",
                    "key": data["organization_0_children"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #0 Child #1",
                    "key": data["organization_0_children"][1].get_es_id(),
                },
            ],
        )

    def test_query_courses_filter_organizations_children_aggs(self, *_):
        """
        It should be possible to limit faceting on organizations to specific values chosen as
        the children of a given organization, passed in the query string.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?organizations_children_aggs="
                f"{data['top_organizations'][1].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["organizations"]["values"],
            [
                {
                    "count": 1,
                    "human_name": "Organization #1 Child #0",
                    "key": data["organization_1_children"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #1 Child #1",
                    "key": data["organization_1_children"][1].get_es_id(),
                },
            ],
        )

    def test_query_courses_filter_subject(self, *_):
        """
        Battle test filtering by a subject.
        """
        data = self.prepare_indices()
        response = self.client.get(
            ("/api/v1.0/courses/?subjects=" f"{data['top_subjects'][0].get_es_id()}")
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to subject 2:
        courses_definition = filter(
            lambda c: c[0] in [0, 1], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_multiple_subjects(self, *_):
        """
        Battle test filtering by multiple subjects.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?subjects="
                f"{data['top_subjects'][0].get_es_id()}"
                "&subjects="
                f"{data['top_subjects'][3].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to subjects 1 or 4:
        courses_definition = filter(
            lambda c: c[0] in [0, 1, 3], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_subjects_aggs(self, *_):
        """
        It should be possible to limit faceting on a subject to specific values by passing them
        as a list in the querystring.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?subjects_aggs="
                f"{data['subject_0_children'][0].get_es_id()}"
                "&subjects_aggs="
                f"{data['subject_0_children'][1].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"]["values"],
            [
                {
                    "count": 1,
                    "human_name": "Subject #0 Child #0",
                    "key": data["subject_0_children"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #0 Child #1",
                    "key": data["subject_0_children"][1].get_es_id(),
                },
            ],
        )

    def test_query_courses_filter_subjects_children_aggs(self, *_):
        """
        It should be possible to limit faceting on subjects to specific values chosen as
        the children of a given subject, passed in the query string.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?subjects_children_aggs="
                f"{data['top_subjects'][1].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["filters"]["subjects"]["values"],
            [
                {
                    "count": 1,
                    "human_name": "Subject #1 Child #0",
                    "key": data["subject_1_children"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #1 Child #1",
                    "key": data["subject_1_children"][1].get_es_id(),
                },
            ],
        )

    def test_query_courses_filter_level(self, *_):
        """
        Battle test filtering by a level.
        """
        data = self.prepare_indices()
        response = self.client.get(
            f"/api/v1.0/courses/?levels={data['levels'][0].get_es_id()}"
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to this level:
        courses_definition = filter(
            lambda c: c[0] in [0, 2], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_filter_multiple_levels(self, *_):
        """
        Battle test filtering by multiple levels.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?levels="
                f"{data['levels'][0].get_es_id()}"
                "&levels="
                f"{data['levels'][1].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to these levels:
        courses_definition = filter(
            lambda c: c[0] in [0, 2, 3], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_match_all_no_filter_pages(self, *_):
        """
        Running a query when indexable filter pages are absent should result in empty facets.
        This behavior is because "include" for each filter definition defaults to the list of
        children for the base page (the one whose reverse_id matches the filter settings).
        If the base page does not exist, the filter is empty.
        """
        self.prepare_indices()
        for reverse_id in ["subjects", "levels", "organizations"]:
            Page.objects.get(reverse_id=reverse_id, publisher_is_draft=False).delete()
        response = self.client.get("/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["filters"]["subjects"]["values"], [])
        self.assertEqual(response.json()["filters"]["levels"]["values"], [])
        self.assertEqual(response.json()["filters"]["organizations"]["values"], [])

    def test_query_courses_by_related_person(self, *_):
        """
        Full-text search appropriately returns the list of courses that match a given
        related person name even through a text query.
        """
        data = self.prepare_indices()
        response = self.client.get("/api/v1.0/courses/?query=boulgakov")
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to persons whose name contains "boulgakov"
        courses_definition = filter(
            lambda c: c[0] in [0, 3], data["courses_definition"]
        )
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_text_language_analyzer_query(self, *_):
        """
        Full-text search appropriately returns the list of courses that match a given
        word through a language analyzer.
        The score of the text query impacts ordering.
        """
        self.prepare_indices(
            suite=[["B", "F", "I"], ["E", "C"], ["H", "G"], ["D", "A"]],
        )
        response = self.client.get("/api/v1.0/courses/?query=artificial")
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that contain the word "artificial"
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])), [0, 3, 2]
        )

    def test_query_courses_text_language_analyzer_with_filter_category(self, *_):
        """
        Full-text search through the language analyzer combines with another filter.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                "/api/v1.0/courses/?query=artificial&subjects="
                f"{data['top_subjects'][0].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        # Keep only the courses that are linked to category one and contain the word "artificial"
        courses_definition = filter(lambda c: c[0] in [0], data["courses_definition"])
        self.assertEqual(
            list((int(c["id"]) for c in response.json()["objects"])),
            self.get_expected_courses(courses_definition, list(data["course_runs"])),
        )

    def test_query_courses_code_partial(self, *_):
        """Full-text search should match partial codes."""
        self.prepare_indices()
        for query in ["3rs", "3rst", "03rst", "003rst"]:
            response = self.client.get(f"/api/v1.0/courses/?query={query:s}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                list((int(c["id"]) for c in response.json()["objects"])), [2]
            )

    def test_query_courses_code_fuzzy(self, *_):
        """Full-text search should match codes with automatic fuzziness."""
        self.prepare_indices()
        # A Levenshtein distance of 1 matches even our shortest search queries (3 characters)
        for query in ["7rs", "3dst", "13rst", "003rsg"]:
            response = self.client.get(f"/api/v1.0/courses/?query={query:s}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                list((int(c["id"]) for c in response.json()["objects"])), [2]
            )

        # A Levenshtein distance of 2 matches only for search queries of at least 5 characters
        for query in ["7ds", "3det", "14rst"]:
            response = self.client.get(f"/api/v1.0/courses/?query={query:s}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                list((int(c["id"]) for c in response.json()["objects"])), []
            )

        response = self.client.get("/api/v1.0/courses/?query=003rfg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list((int(c["id"]) for c in response.json()["objects"])), [2])

        # A Levenshtein distance of 3 doesn't match for search queries of 5 characters
        # (we could test for longer queries...)
        for query in ["7de", "3def", "14dst", "003efg"]:
            response = self.client.get(f"/api/v1.0/courses/?query={query:s}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                list((int(c["id"]) for c in response.json()["objects"])), []
            )

    def test_query_courses_children_aggs_over_aggs_list(self, *_):
        """
        When both [filter]_children_aggs and [filter]_aggs, two conflicting
        aggregations-related parameters, are present in a query, [filter]_children_aggs should
        take precedence.
        """
        data = self.prepare_indices()
        response = self.client.get(
            (
                # Query string directly requests subject 0 children 0 and 1, and requests
                # subject 1's children through the [filter]_children_aggs parameter.
                "/api/v1.0/courses/?subjects_aggs="
                f"{data['subject_0_children'][0].get_es_id()}"
                "&subjects_aggs="
                f"{data['subject_0_children'][1].get_es_id()}"
                "&subjects_children_aggs="
                f"{data['top_subjects'][1].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        # Only subject 1's children are included, not the subjects requested directly.
        self.assertEqual(
            response.json()["filters"]["subjects"]["values"],
            [
                {
                    "count": 1,
                    "human_name": "Subject #1 Child #0",
                    "key": data["subject_1_children"][0].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Subject #1 Child #1",
                    "key": data["subject_1_children"][1].get_es_id(),
                },
            ],
        )
