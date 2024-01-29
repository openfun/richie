"""Tests for environment ElasticSearch support."""

import json
import random
from http.cookies import SimpleCookie
from unittest import mock

from django.core.cache import caches
from django.test import TestCase

import arrow

from richie.apps.courses.factories import CategoryFactory, OrganizationFactory
from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.filter_definitions import FILTERS
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.indexers.organizations import OrganizationsIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS


@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    CoursesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_courses",
)
class EdgeCasesCoursesQueryTestCase(TestCase):
    """
    Test edge case search queries to make sure facetting works as we expect.
    """

    def setUp(self):
        """Reset indexable filters cache before each test so the context is as expected."""
        super().setUp()
        self.reset_filter_definitions_cache()
        self.__filter_pages__ = None

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

    def create_filter_pages(self):
        """Create pages for each filter based on an indexable."""
        if not self.__filter_pages__:
            self.__filter_pages__ = {
                "levels": CategoryFactory(
                    page_reverse_id="levels", page_title="Levels", should_publish=True
                ),
                "subjects": CategoryFactory(
                    page_reverse_id="subjects",
                    page_title="Subjects",
                    should_publish=True,
                ),
                "organizations": OrganizationFactory(
                    page_reverse_id="organizations",
                    page_title="Organizations",
                    should_publish=True,
                ),
            }

        return self.__filter_pages__

    def prepare_index(self, courses, organizations=None):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class:
        preparing the Elasticsearch index so that individual tests just have to execute
        the query.
        """
        organizations = organizations or []
        self.create_filter_pages()
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")

        # Create an index for our organizations
        ES_INDICES_CLIENT.create(index="richie_organizations")
        ES_INDICES_CLIENT.close(index="richie_organizations")
        ES_INDICES_CLIENT.put_settings(
            body=ANALYSIS_SETTINGS, index="richie_organizations"
        )
        ES_INDICES_CLIENT.open(index="richie_organizations")
        # Use the default organizations mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=OrganizationsIndexer.mapping, index="richie_organizations"
        )

        # Set up empty indices for other objects. They need to exist to avoid errors
        # but we do not use results from them in our tests.
        ES_INDICES_CLIENT.create(index="richie_licences")
        ES_INDICES_CLIENT.create(index="richie_categories")
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

        # Prepare actions to insert our courses and organizations in their indices
        actions = [
            OrganizationsIndexer.get_es_document_for_organization(
                organization.public_extension
            )
            for organization in organizations
        ] + [
            {
                "_id": course["id"],
                "_index": "test_courses",
                "_op_type": "create",
                **course,
            }
            for course in courses
        ]

        bulk_compat(actions=actions, chunk_size=500, client=ES_CLIENT)
        ES_INDICES_CLIENT.refresh()

    def test_query_courses_filter_box_titles_french(self, *_):
        """
        Filter box titles should be in french when the language cookie is set.
        """

        self.prepare_index([])
        self.client.cookies = SimpleCookie({"django_language": "fr"})
        response = self.client.get("/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            [v["human_name"] for v in content["filters"].values()],
            [
                "Nouveaux cours",
                "Disponibilité",
                "Sujets",
                "Niveaux",
                "Établissements",
                "Langues",
                "Personnes",
                "Licences",
                "Rythme hebdomadaire",
            ],
        )

    def test_query_courses_rare_facet_force(self, *_):
        """
        A facet that is selected in the querystring should always be included in the result's
        facet counts, even if it is not in the top 10.
        """
        filter_pages = self.create_filter_pages()

        organizations = [
            OrganizationFactory(
                page_parent=filter_pages["organizations"].extended_object,
                page_title=f"Organization #{index}",
                should_publish=True,
            )
            for index in range(11)
        ]

        self.prepare_index(
            [
                {
                    "absolute_url": {"en": "url"},
                    "categories": [],
                    "code": "abc123",
                    "course_runs": [],
                    "cover_image": {"en": "cover_image.jpg"},
                    "duration": {"en": "N/A"},
                    "effort": {"en": "N/A"},
                    "icon": {"en": "icon.jpg"},
                    "id": index,
                    "introduction": {"en": "introduction"},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [organization.get_es_id()],
                    "organizations_names": {
                        "en": [organization.extended_object.get_title()]
                    },
                    "title": {"en": "title"},
                }
                # 2 occurences for the first 10 organizations, only one for the 11th and last one
                for index, organization in enumerate(
                    organizations + organizations[0:10]
                )
            ],
            organizations=organizations,
        )
        # If not filter is applied, the 10 top facets should be returned
        response = self.client.get("/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Organization #0",
                    "key": organizations[0].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #1",
                    "key": organizations[1].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #2",
                    "key": organizations[2].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #3",
                    "key": organizations[3].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #4",
                    "key": organizations[4].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #5",
                    "key": organizations[5].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #6",
                    "key": organizations[6].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #7",
                    "key": organizations[7].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #8",
                    "key": organizations[8].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #9",
                    "key": organizations[9].get_es_id(),
                },
            ],
        )

        # If organizations are selected, they should be included in the facet counts:
        # - at its place for the one that is in the top 10
        # - at the end for the one that is not in the top 10 and should not be included
        #   if it wasn't forced...
        response = self.client.get(
            (
                "/api/v1.0/courses/?organizations="
                f"{organizations[1].get_es_id()}"
                "&organizations="
                f"{organizations[10].get_es_id()}"
            )
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {
                    "count": 2,
                    "human_name": "Organization #0",
                    "key": organizations[0].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #1",
                    "key": organizations[1].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #2",
                    "key": organizations[2].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #3",
                    "key": organizations[3].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #4",
                    "key": organizations[4].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #5",
                    "key": organizations[5].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #6",
                    "key": organizations[6].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #7",
                    "key": organizations[7].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #8",
                    "key": organizations[8].get_es_id(),
                },
                {
                    "count": 2,
                    "human_name": "Organization #9",
                    "key": organizations[9].get_es_id(),
                },
                {
                    "count": 1,
                    "human_name": "Organization #10",
                    "key": organizations[10].get_es_id(),
                },
            ],
        )

    def test_query_courses_rare_facet_no_aggs_match(self, *_):
        """
        A facet that is selected in the querystring should not be included in the result's
        facet counts if it does not match the aggs parameter (include regex or filter page
        children test).
        """
        filter_pages = self.create_filter_pages()

        # 10 organizations that are children of the Organizations filter page
        organizations = [
            OrganizationFactory(
                page_parent=filter_pages["organizations"].extended_object,
                page_title=f"Organization #{index}",
                should_publish=True,
            )
            for index in range(10)
        ]
        # 1 organization that is a child of another organization
        organizations += [
            OrganizationFactory(
                page_parent=organizations[0].extended_object,
                page_title="Organization #0 child",
                should_publish=True,
            )
        ]

        self.prepare_index(
            [
                {
                    "absolute_url": {"en": "url"},
                    "categories": [],
                    "code": "abc123",
                    "course_runs": [],
                    "cover_image": {"en": "cover_image.jpg"},
                    "duration": {"en": "N/A"},
                    "effort": {"en": "N/A"},
                    "icon": {"en": "icon.jpg"},
                    "id": index,
                    "introduction": {"en": "introduction"},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [organization.get_es_id()],
                    "organizations_names": {
                        "en": [organization.extended_object.get_title()]
                    },
                    "title": {"en": "title"},
                }
                for index, organization in enumerate(organizations)
            ],
            organizations=organizations,
        )

        response = self.client.get(
            f"/api/v1.0/courses/?organizations={organizations[10].get_es_id()}"
        )
        self.assertEqual(response.status_code, 200)

        reponse_organization_ids = [
            o["key"] for o in response.json()["filters"]["organizations"]["values"]
        ]
        self.assertIn(
            organizations[0].get_es_id(),
            reponse_organization_ids,
        )
        for organization in organizations[1:10]:
            self.assertIn(
                organization.get_es_id(),
                reponse_organization_ids,
            )
        self.assertNotIn(
            organizations[10].get_es_id(),
            reponse_organization_ids,
        )

    def test_query_courses_is_listed(self, *_):
        """
        A course that is not flagged for listing should be excluded from results.
        """
        hidden_id = random.randint(0, 2)
        self.prepare_index(
            [
                {
                    "absolute_url": {"en": "url"},
                    "categories": [],
                    "code": "abc123",
                    "course_runs": [],
                    "cover_image": {"en": "cover_image.jpg"},
                    "duration": {"en": "N/A"},
                    "effort": {"en": "N/A"},
                    "icon": {"en": "icon.jpg"},
                    "id": index,
                    "introduction": {"en": "introduction"},
                    "is_new": False,
                    "is_listed": index != hidden_id,
                    "organizations": [],
                    "organizations_names": {"en": []},
                    "title": {"en": "title"},
                }
                for index in range(3)
            ]
        )

        response = self.client.get("/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 2)

        result_ids = [o["id"] for o in content["objects"]]
        for index in range(3):
            self.assertEqual(str(index) in result_ids, index != hidden_id)

    def test_query_courses_no_title(self, *_):
        """
        A course that has no title should not make the search fail with a 500 KeyError.
        """
        self.prepare_index(
            [
                {
                    "absolute_url": {},
                    "categories": [],
                    "code": None,
                    "course_runs": [],
                    "cover_image": {},
                    "duration": {},
                    "effort": {},
                    "icon": {},
                    "id": "xyz",
                    "introduction": {},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [],
                    "organizations_names": {},
                    "title": {},
                }
            ]
        )

        response = self.client.get("/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 1)
        self.assertEqual(content["objects"][0]["id"], "xyz")

    def test_query_courses_french_ending_with_diacritic(self, *_):
        """
        Check that words ending in "ité" are well analyzed.
        This test follows a bug in ordering of char filters.
        We were stemming before doing the ascii folding. As a result:
        - "électricité" was indexed as "electr"
        - searching "électricité" was analyzed as "electr" => ok
        - searching "electricite" was analylzed as "electricit" => nok
        """
        self.prepare_index(
            [
                {
                    "absolute_url": {},
                    "categories": [],
                    "code": "abc123",
                    "course_runs": [],
                    "cover_image": {},
                    "duration": {},
                    "effort": {},
                    "icon": {},
                    "id": "001",
                    "introduction": {"fr": "obscurité"},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [],
                    "organizations_names": {},
                    "title": {"fr": "électricité"},
                    "description": {"fr": "pénalité"},
                }
            ]
        )

        # The course should be found whether the query has accents or not
        for query in [
            "électricité",
            "electricite",
            "pénalité",
            "penalite",
            "obscurité",
            "obscurite",
        ]:
            response = self.client.get(f"/api/v1.0/courses/?query={query:s}")
            self.assertEqual(response.status_code, 200)
            content = json.loads(response.content)
            self.assertEqual(len(content["objects"]), 1)

    def test_query_courses_title_boost(self, *_):
        """
        A good match on the title field for an archived course should score better
        than a less good match on another field for an open course.
        """
        self.prepare_index(
            [
                # An archived course
                {
                    "absolute_url": {},
                    "categories": [],
                    "code": None,
                    "course_runs": [
                        {
                            "start": arrow.utcnow().shift(days=-30).datetime,
                            "end": arrow.utcnow().shift(days=-1).datetime,
                            "enrollment_start": arrow.utcnow().shift(days=-50).datetime,
                            "enrollment_end": arrow.utcnow().shift(days=-35).datetime,
                            "languages": ["fr"],
                        }
                    ],
                    "cover_image": {},
                    "duration": {},
                    "effort": {},
                    "icon": {},
                    "id": "001",
                    "introduction": {},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [],
                    "organizations_names": {},
                    "title": {"fr": "Course de cuisine à l'Auberge du pont"},
                    "description": {"fr": "Les Abers"},
                },
                # An open course
                {
                    "absolute_url": {},
                    "categories": [],
                    "code": None,
                    "course_runs": [
                        {
                            "start": arrow.utcnow().shift(days=+5).datetime,
                            "end": arrow.utcnow().shift(days=+30).datetime,
                            "enrollment_start": arrow.utcnow().shift(days=-5).datetime,
                            "enrollment_end": arrow.utcnow().shift(days=+5).datetime,
                            "languages": ["fr"],
                        }
                    ],
                    "cover_image": {},
                    "duration": {},
                    "effort": {},
                    "icon": {},
                    "id": "002",
                    "introduction": {},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [],
                    "organizations_names": {},
                    "title": {"fr": "Demander la chambre 304 de l'hôtel Vauban"},
                    "description": {"fr": "Pont Recouvrance"},
                },
            ]
        )

        response = self.client.get("/api/v1.0/courses/?query=pont")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 2)
        self.assertEqual(content["objects"][0]["id"], "002")

        response = self.client.get("/api/v1.0/courses/?query=auberge+pont")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 2)
        self.assertEqual(content["objects"][0]["id"], "001")

        response = self.client.get("/api/v1.0/courses/?query=pont+recouvrance")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 2)
        self.assertEqual(content["objects"][0]["id"], "002")

    def test_query_courses_code_vs_title(self, *_):
        """
        A match on the code field for an archived course should score better
        than a match on another field for an open course.
        """
        self.prepare_index(
            [
                # An archived course
                {
                    "absolute_url": {},
                    "categories": [],
                    "code": "123abc",
                    "course_runs": [
                        {
                            "start": arrow.utcnow().shift(days=-30).datetime,
                            "end": arrow.utcnow().shift(days=-1).datetime,
                            "enrollment_start": arrow.utcnow().shift(days=-50).datetime,
                            "enrollment_end": arrow.utcnow().shift(days=-35).datetime,
                            "languages": ["fr"],
                        }
                    ],
                    "cover_image": {},
                    "duration": {},
                    "effort": {},
                    "icon": {},
                    "id": "001",
                    "introduction": {},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [],
                    "organizations_names": {},
                    "title": {"fr": "Lambda title"},
                    "description": {"fr": "Lambda description"},
                },
                # An open course
                {
                    "absolute_url": {},
                    "categories": [],
                    "code": "456lmn",
                    "course_runs": [
                        {
                            "start": arrow.utcnow().shift(days=+5).datetime,
                            "end": arrow.utcnow().shift(days=+30).datetime,
                            "enrollment_start": arrow.utcnow().shift(days=-5).datetime,
                            "enrollment_end": arrow.utcnow().shift(days=+5).datetime,
                            "languages": ["fr"],
                        }
                    ],
                    "cover_image": {},
                    "duration": {},
                    "effort": {},
                    "icon": {},
                    "id": "002",
                    "introduction": {},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [],
                    "organizations_names": {},
                    "title": {"fr": "This title includes the code 123abc"},
                    "description": {"fr": "Another text"},
                },
            ]
        )

        response = self.client.get("/api/v1.0/courses/?query=123abc")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 2)
        self.assertEqual(content["objects"][0]["id"], "001")

        response = self.client.get("/api/v1.0/courses/?query=123abc+title")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 2)
        self.assertEqual(content["objects"][0]["id"], "001")

        # If the code match is narrow and the title match is good, the title
        # field should prevail
        response = self.client.get("/api/v1.0/courses/?query=ab+title")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 2)
        self.assertEqual(content["objects"][0]["id"], "002")

    def test_query_courses_negative_score(self, *_):
        """
        Negative scores should not happen and cause a 500 error for courses far in the future.
        """
        self.prepare_index(
            [
                {
                    "absolute_url": {"en": "url"},
                    "categories": [],
                    "code": "abc123",
                    "course_runs": [
                        {
                            "start": arrow.get(9999, 1, 1).datetime,
                            "end": arrow.get(9999, 5, 1).datetime,
                            "enrollment_start": arrow.utcnow().shift(days=-5).datetime,
                            "enrollment_end": arrow.utcnow().shift(days=+5).datetime,
                            "languages": ["fr"],
                        }
                    ],
                    "cover_image": {"en": "cover_image.jpg"},
                    "duration": {"en": "N/A"},
                    "effort": {"en": "N/A"},
                    "icon": {"en": "icon.jpg"},
                    "id": "001",
                    "introduction": {"en": "introduction"},
                    "is_new": False,
                    "is_listed": True,
                    "organizations": [],
                    "organizations_names": {"en": []},
                    "title": {"en": "title"},
                }
            ]
        )

        response = self.client.get("/api/v1.0/courses/?query=title")
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertEqual(len(content["objects"]), 1)
