"""Tests for environment ElasticSearch support."""
import json
import random
from http.cookies import SimpleCookie
from unittest import mock

from django.test import TestCase

from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

from richie.apps.courses.factories import CategoryFactory, OrganizationFactory
from richie.apps.search import ES_CLIENT
from richie.apps.search.filter_definitions import FILTERS, IndexableFilterDefinition
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS


@mock.patch.object(  # Avoid having to build the categories and organizations indices
    IndexableFilterDefinition,
    "get_i18n_names",
    side_effect=lambda o: {key: f"#{key:s}" for key in o},
)
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

    def tearDown(self):
        """Reset indexable filters cache after each test to avoid impacting subsequent tests."""
        super().tearDown()
        self.reset_filter_definitions_cache()

    @staticmethod
    def reset_filter_definitions_cache():
        """Reset indexable filters cache on the `base_page` field."""
        for filter_name in ["levels", "subjects", "organizations"]:
            # pylint: disable=protected-access
            FILTERS[filter_name]._base_page = None

    @staticmethod
    def create_filter_pages():
        """
        Create pages for each filter based on an indexable. We must create them in the same order
        as they are instantiated in order to match the node paths we expect:
            - subjects page path: 0001
            - levels page path: 0002
            - organizations page path: 0003
        """
        CategoryFactory(page_reverse_id="subjects", should_publish=True)
        CategoryFactory(page_reverse_id="levels", should_publish=True)
        OrganizationFactory(page_reverse_id="organizations", should_publish=True)

    def prepare_index(self, courses):
        """
        Not a test.
        This method is doing the heavy lifting for the tests in this class:
        - prepare the Elasticsearch index,
        - execute the query.
        """
        self.create_filter_pages()
        # Index these 4 courses in Elasticsearch
        indices_client = IndicesClient(client=ES_CLIENT)
        # Delete any existing indexes so we get a clean slate
        indices_client.delete(index="_all")
        # Create an index we'll use to test the ES features
        indices_client.create(index="test_courses")
        indices_client.close(index="test_courses")
        indices_client.put_settings(body=ANALYSIS_SETTINGS, index="test_courses")
        indices_client.open(index="test_courses")

        # Use the default courses mapping from the Indexer
        indices_client.put_mapping(
            body=CoursesIndexer.mapping, doc_type="course", index="test_courses"
        )
        # Add the sorting script
        ES_CLIENT.put_script(id="state", body=CoursesIndexer.scripts["state"])
        # Actually insert our courses in the index
        actions = [
            {
                "_id": course["id"],
                "_index": "test_courses",
                "_op_type": "create",
                "_type": "course",
                **course,
            }
            for course in courses
        ]
        bulk(actions=actions, chunk_size=500, client=ES_CLIENT)
        indices_client.refresh()

    def test_query_courses_filter_box_titles_french(self, *_):
        """
        Filter box titles should be in french when the language cookie is set.
        """

        self.prepare_index([])
        self.client.cookies = SimpleCookie({"django_language": "fr"})
        response = self.client.get(f"/api/v1.0/courses/")
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
            ],
        )

    def test_query_courses_rare_facet_force(self, *_):
        """
        A facet that is selected in the querystring should always be included in the result's
        facet counts, even if it is not in the top 10.
        """
        organizations = [
            "L-0003{:04d}".format(o + 1) for o in range(10)
        ] * 2  # 10 organizations with 2 occurences
        organizations.append("L-00030011")  # 1 organization with only 1 occurence
        # => organization with ID "L-00030011" is not in the top ten facets.

        self.prepare_index(
            [
                {
                    "absolute_url": {"en": "url"},
                    "categories": [],
                    "course_runs": [],
                    "cover_image": {"en": "cover_image.jpg"},
                    "icon": {"en": "icon.jpg"},
                    "id": index,
                    "is_new": False,
                    "organizations": [id],
                    "organizations_names": {"en": ["Org #{:s}".format(id)]},
                    "title": {"en": "title"},
                }
                for index, id in enumerate(organizations)
            ]
        )

        # If not filter is applied, the 10 top facets should be returned
        response = self.client.get(f"/api/v1.0/courses/")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {"count": 2, "human_name": "#L-00030001", "key": "L-00030001"},
                {"count": 2, "human_name": "#L-00030002", "key": "L-00030002"},
                {"count": 2, "human_name": "#L-00030003", "key": "L-00030003"},
                {"count": 2, "human_name": "#L-00030004", "key": "L-00030004"},
                {"count": 2, "human_name": "#L-00030005", "key": "L-00030005"},
                {"count": 2, "human_name": "#L-00030006", "key": "L-00030006"},
                {"count": 2, "human_name": "#L-00030007", "key": "L-00030007"},
                {"count": 2, "human_name": "#L-00030008", "key": "L-00030008"},
                {"count": 2, "human_name": "#L-00030009", "key": "L-00030009"},
                {"count": 2, "human_name": "#L-00030010", "key": "L-00030010"},
            ],
        )

        # If organizations are selected, they should be included in the facet counts:
        # - at its place for the one that is in the top 10
        # - at the end for the one that is not in the top 10 and should not be included
        #   if it wasn't forced...
        response = self.client.get(
            f"/api/v1.0/courses/?organizations=L-00030002&organizations=L-00030011"
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertEqual(
            content["filters"]["organizations"]["values"],
            [
                {"count": 2, "human_name": "#L-00030001", "key": "L-00030001"},
                {"count": 2, "human_name": "#L-00030002", "key": "L-00030002"},
                {"count": 2, "human_name": "#L-00030003", "key": "L-00030003"},
                {"count": 2, "human_name": "#L-00030004", "key": "L-00030004"},
                {"count": 2, "human_name": "#L-00030005", "key": "L-00030005"},
                {"count": 2, "human_name": "#L-00030006", "key": "L-00030006"},
                {"count": 2, "human_name": "#L-00030007", "key": "L-00030007"},
                {"count": 2, "human_name": "#L-00030008", "key": "L-00030008"},
                {"count": 2, "human_name": "#L-00030009", "key": "L-00030009"},
                {"count": 2, "human_name": "#L-00030010", "key": "L-00030010"},
                {"count": 1, "human_name": "#L-00030011", "key": "L-00030011"},
            ],
        )

    def test_query_courses_rare_facet_no_include_match(self, *_):
        """
        A facet that is selected in the querystring should not be included in the result's
        facet counts if it does not match the include regex.
        """
        organizations = [
            "L-0003{:04d}".format(o + 1) for o in range(10)
        ]  # 10 organizations matching the include regex
        organizations.append(
            "L-000300010001"
        )  # 1 organization not matching the include regex

        self.prepare_index(
            [
                {
                    "absolute_url": {"en": "url"},
                    "categories": [],
                    "course_runs": [],
                    "cover_image": {"en": "cover_image.jpg"},
                    "icon": {"en": "icon.jpg"},
                    "id": index,
                    "is_new": False,
                    "organizations": random.sample(
                        organizations, random.randint(1, len(organizations))
                    ),
                    "organizations_names": {"en": ["Org #{:s}".format(id)]},
                    "title": {"en": "title"},
                }
                for index, id in enumerate(organizations)
            ]
        )

        response = self.client.get(f"/api/v1.0/courses/?organizations=L-000300010001")
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)

        self.assertNotIn(
            "L-000300010001",
            [o["key"] for o in content["filters"]["organizations"]["values"]],
        )
