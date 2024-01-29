"""
Tests related to internationalization of course searches.
"""

from django.test import TestCase

from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    OrganizationFactory,
)
from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.elasticsearch import bulk_compat
from richie.apps.search.filter_definitions import FILTERS
from richie.apps.search.indexers import ES_INDICES
from richie.apps.search.indexers.courses import CoursesIndexer
from richie.apps.search.text_indexing import ANALYSIS_SETTINGS


class CoursesI18nQueryTestCase(TestCase):
    """
    Test internationalization of course searches specifically. This lets us avoid interfering
    with the rest of course query tests which are already lengthy and complex enough.
    """

    def setUp(self):
        """Reset indexable filters cache before each test so the context is as expected."""
        super().setUp()
        self.reset_filter_definitions_cache()
        self.prepare_es()

    def tearDown(self):
        """Reset indexable filters cache after each test to avoid impacting subsequent tests."""
        super().tearDown()
        self.reset_filter_definitions_cache()

    @staticmethod
    def reset_filter_definitions_cache():
        """Reset indexable filters cache on the `base_page` field."""
        for filter_name in ["levels", "organizations", "persons", "subjects"]:
            # pylint: disable=protected-access
            FILTERS[filter_name]._base_page = None

    @staticmethod
    def prepare_es():
        """
        Prepare the ES index so we only have to manage indexing and searches in our
        actual tests.
        """
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create the indices we'll use to test the ES features
        for index in [
            "richie_categories",
            "richie_courses",
            "richie_licences",
            "richie_persons",
            "richie_organizations",
        ]:
            ES_INDICES_CLIENT.create(index=index)
            ES_INDICES_CLIENT.close(index=index)
            ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index=index)
            ES_INDICES_CLIENT.open(index=index)

        # Use the default courses mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=CoursesIndexer.mapping, index="richie_courses"
        )
        # Add the sorting script
        ES_CLIENT.put_script(id="score", body=CoursesIndexer.scripts["score"])
        ES_CLIENT.put_script(
            id="state_field", body=CoursesIndexer.scripts["state_field"]
        )

    def test_indexable_filters_internationalization(self):
        """
        Indexable filters (such as categories and organizations by default) should have
        their names localized in the filter definitions in course search responses.
        """
        # Create the meta categories, each with a child category that should appear in facets
        subjects_meta = CategoryFactory(page_reverse_id="subjects", should_publish=True)
        subject = CategoryFactory(
            page_parent=subjects_meta.extended_object, should_publish=True
        )
        levels_meta = CategoryFactory(page_reverse_id="levels", should_publish=True)
        level = CategoryFactory(
            page_parent=levels_meta.extended_object, should_publish=True
        )
        # Create 2 organizations that should appear in facets
        org_meta = OrganizationFactory(
            page_reverse_id="organizations", should_publish=True
        )
        org_1 = OrganizationFactory(
            page_parent=org_meta.extended_object,
            page_title="First organization",
            should_publish=True,
        )
        org_2 = OrganizationFactory(
            page_parent=org_meta.extended_object,
            page_title="Second organization",
            should_publish=True,
        )
        # Create a course linked to our categories and organizations
        CourseFactory(
            fill_categories=[subject, level],
            fill_organizations=[org_1, org_2],
            should_publish=True,
        )
        # Index our objects into ES
        bulk_compat(
            actions=[
                *ES_INDICES.categories.get_es_documents(),
                *ES_INDICES.organizations.get_es_documents(),
                *ES_INDICES.courses.get_es_documents(),
            ],
            chunk_size=500,
            client=ES_CLIENT,
        )
        ES_INDICES_CLIENT.refresh()

        response = self.client.get("/api/v1.0/courses/?scope=filters")
        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json()["filters"]["subjects"],
            {
                "base_path": "0001",
                "human_name": "Subjects",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "subjects",
                "position": 2,
                "has_more_values": False,
                "values": [
                    {
                        "count": 1,
                        "human_name": subject.extended_object.get_title(),
                        "key": subject.get_es_id(),
                    }
                ],
            },
        )
        self.assertEqual(
            response.json()["filters"]["levels"],
            {
                "base_path": "0002",
                "human_name": "Levels",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "levels",
                "position": 3,
                "has_more_values": False,
                "values": [
                    {
                        "count": 1,
                        "human_name": level.extended_object.get_title(),
                        "key": level.get_es_id(),
                    }
                ],
            },
        )
        self.assertEqual(
            response.json()["filters"]["organizations"],
            {
                "base_path": "0003",
                "human_name": "Organizations",
                "is_autocompletable": True,
                "is_drilldown": False,
                "is_searchable": True,
                "name": "organizations",
                "position": 4,
                "has_more_values": False,
                "values": [
                    {
                        "count": 1,
                        "human_name": org_1.extended_object.get_title(),
                        "key": org_1.get_es_id(),
                    },
                    {
                        "count": 1,
                        "human_name": org_2.extended_object.get_title(),
                        "key": org_2.get_es_id(),
                    },
                ],
            },
        )
