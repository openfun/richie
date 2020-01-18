"""
Tests for the index_manager utilities
"""
from datetime import datetime
from unittest import mock

from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone

import pytz
from elasticsearch.client import IndicesClient
from elasticsearch.exceptions import NotFoundError

from richie.apps.courses.factories import CourseFactory
from richie.apps.search import ES_CLIENT
from richie.apps.search.index_manager import (
    get_indices_by_alias,
    perform_create_index,
    regenerate_indices,
    store_es_scripts,
)
from richie.apps.search.signals import update_course


class IndexManagerTestCase(TestCase):
    """
    Test the functions that generate and maintain our elasticsearch indices.
    """

    def setUp(self):
        """
        Make sure all indices are deleted before each new test is run.
        """
        super().setUp()
        self.indices_client = IndicesClient(client=ES_CLIENT)
        self.indices_client.delete(index="_all")

    def test_index_manager_get_indices_by_alias(self):
        """
        Receive a generator that contains the n-1 index for an alias.
        """
        alias = "richie_courses"
        existing_indices = {
            "richie_courses_2014-05-04-03h12m33.123456s": {},
            "richie_courses_2015-05-04-03h12m33.123456s": {
                "aliases": {"richie_courses": True}
            },
            "richie_organizations_2017-05-04-03h12m33.123456s": {
                "aliases": {"richie_organizations": True}
            },
        }
        self.assertEqual(
            list(get_indices_by_alias(existing_indices, alias)),
            [("richie_courses_2015-05-04-03h12m33.123456s", "richie_courses")],
        )

    def test_index_manager_get_indices_by_alias_with_duplicate(self):
        """
        Clean up the aliases when starting from a broken state: duplicate indices for an alias.
        """
        alias = "richie_courses"
        existing_indices = {
            "richie_courses_2013-05-04-03h12m33.123456s": {},
            "richie_courses_2014-05-04-03h12m33.123456s": {
                "aliases": {"richie_courses": True}
            },
            "richie_courses_2015-05-04-03h12m33.123456s": {
                "aliases": {"richie_courses": True}
            },
            "richie_organizations_2017-05-04-03h12m33.123456s": {
                "aliases": {"richie_organizations": True}
            },
        }
        self.assertEqual(
            list(get_indices_by_alias(existing_indices, alias)),
            [
                ("richie_courses_2014-05-04-03h12m33.123456s", "richie_courses"),
                ("richie_courses_2015-05-04-03h12m33.123456s", "richie_courses"),
            ],
        )

    def test_index_manager_get_indices_by_alias_empty(self):
        """
        Don't wrongly push values when there is nothing to return.
        """
        alias = "richie_courses"
        existing_indices = {
            "richie_courses_2013-05-04-03h12m33.123456s": {},
            "richie_organizations_2017-05-04-03h12m33.123456s": {
                "aliases": {"richie_organizations": True}
            },
        }
        self.assertEqual(list(get_indices_by_alias(existing_indices, alias)), [])

    # Make sure indexing still works when the number of records is higher than chunk size
    @override_settings(RICHIE_ES_CHUNK_SIZE=2)
    def test_index_manager_perform_create_index(self):
        """
        Perform all side-effects through the ES client and return the index name (incl. timestamp)
        """

        # Create an indexable from scratch that mimicks the expected shape of the dynamic
        # import in es_index
        class IndexableClass:
            """Indexable stub"""

            document_type = "course"
            index_name = "richie_courses"
            mapping = {
                "properties": {"code": {"type": "keyword"}, "name": {"type": "text"}}
            }

            # pylint: disable=no-self-use
            def get_es_documents(self, index, action="index"):
                """Stub method"""

                for i in range(0, 10):
                    yield {
                        "_id": i,
                        "_index": index,
                        "_op_type": action,
                        "_type": "course",
                        "code": "course-{:d}".format(i),
                        "name": "Course Number {:d}".format(i),
                    }

        indexable = IndexableClass()

        # Set a fake time to check the name of the index
        now = datetime(2016, 5, 4, 3, 12, 33, 123456, tzinfo=pytz.utc)

        # Make sure our index is empty before we call the function
        self.assertEqual(self.indices_client.get_alias("*"), {})

        mock_logger = mock.Mock(spec=["info"])

        with mock.patch.object(timezone, "now", return_value=now):
            new_index = perform_create_index(indexable, mock_logger)
        self.indices_client.refresh()

        self.assertEqual(new_index, "richie_courses_2016-05-04-03h12m33.123456s")
        self.assertEqual(ES_CLIENT.count()["count"], 10)
        self.assertEqual(
            self.indices_client.get_mapping(),
            {
                "richie_courses_2016-05-04-03h12m33.123456s": {
                    "mappings": {
                        "course": {
                            "properties": {
                                "code": {"type": "keyword"},
                                "name": {"type": "text"},
                            }
                        }
                    }
                }
            },
        )
        mock_logger.info.assert_called()

    def test_index_manager_regenerate_indices(self):
        """
        Make sure indices are created, aliases updated and old, no longer useful indices
        are pruned when the `regenerate_elasticsearch` function is called.
        """
        # The indices client will be used to test the actual indices in ElasticSearch
        indices_client = IndicesClient(client=ES_CLIENT)

        # Create all our indices from scratch
        # Use a mocked timezone.now to  check the names of our indices as they include a datetime
        creation1_datetime = datetime(2010, 1, 1, tzinfo=timezone.utc)
        creation1_string = creation1_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(timezone, "now", return_value=creation1_datetime):
            regenerate_indices(None)

        expected_indices = [
            "richie_categories",
            "richie_courses",
            "richie_organizations",
            "richie_persons",
        ]
        # All indices were created and properly aliased
        for alias_name in expected_indices:
            new_index_name = f"{alias_name}_{creation1_string}"
            # The index is created
            self.assertIsNotNone(indices_client.get(new_index_name)[new_index_name])
            # The expected alias is associated with the index
            self.assertEqual(
                list(indices_client.get_alias(alias_name).keys())[0], new_index_name
            )

        # Now regenerate the indices, replacing the ones we just created
        creation2_datetime = datetime(2011, 2, 2, tzinfo=timezone.utc)
        creation2_string = creation2_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(timezone, "now", return_value=creation2_datetime):
            regenerate_indices(None)

        # All indices were replaced and aliases updated
        for alias_name in expected_indices:
            # The index is created
            new_index_name = f"{alias_name}_{creation2_string}"
            self.assertIsNotNone(indices_client.get(new_index_name)[new_index_name])
            # The expected alias is associated with the new index
            self.assertEqual(
                list(indices_client.get_alias(alias_name).keys())[0], new_index_name
            )
            # The previous version of the index is still around
            creation1_index_name = f"{alias_name}_{creation1_string}"
            self.assertIsNotNone(
                indices_client.get(creation1_index_name)[creation1_index_name]
            )
            # But not aliased any more
            self.assertEqual(
                indices_client.get(creation1_index_name)[creation1_index_name][
                    "aliases"
                ],
                {},
            )

        # Regenerate indices again to make sure versions n-2 of indices are
        # deleted (not just unaliased)
        creation3_datetime = datetime(2012, 3, 3, tzinfo=timezone.utc)
        creation3_string = creation3_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(timezone, "now", return_value=creation3_datetime):
            regenerate_indices(None)

        # All indices were replaced and had their aliases changed
        for index_name in expected_indices:
            new_index_name = f"{index_name}_{creation3_string}"
            # The index is created
            self.assertIsNotNone(indices_client.get(new_index_name)[new_index_name])
            # The expected alias is associated with the new index
            self.assertEqual(
                list(indices_client.get_alias(index_name).keys())[0], new_index_name
            )
            # The previous version of the index is still around
            creation2_index_name = f"{alias_name}_{creation2_string}"
            self.assertIsNotNone(
                indices_client.get(creation2_index_name)[creation2_index_name]
            )
            # But not aliased any more
            self.assertEqual(
                indices_client.get(creation2_index_name)[creation2_index_name][
                    "aliases"
                ],
                {},
            )
            # Version n-2 of the index does not exist any more
            with self.assertRaises(NotFoundError):
                indices_client.get(f"{index_name}_{creation1_string}")

    def test_index_manager_regenerate_indices_from_broken_state(self):
        """
        `regenerate_indices` should succeed and give us a working ElasticSearch
        when it runs and finds a broken state (eg. with an existing, incorrect
        index with the name of an alias).

        This can occur when ES restarts and an update signal is triggered before
        Richie had a chance to bootstrap ES.
        """
        # The indices client will be used to test the actual indices in ElasticSearch
        indices_client = IndicesClient(client=ES_CLIENT)

        # Create a course and trigger a signal to index it. This will create a
        # broken "richie_courses" index
        course = CourseFactory(should_publish=True)
        update_course(course.extended_object, "en")
        self.assertIsNotNone(indices_client.get("richie_courses"))

        # Call our `regenerate_indices command`
        creation_datetime = datetime(2010, 1, 1, tzinfo=timezone.utc)
        creation_string = creation_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(timezone, "now", return_value=creation_datetime):
            regenerate_indices(None)

        # No error was thrown, the courses index (like all others) was bootstrapped
        self.assertIsNotNone(indices_client.get(f"richie_courses_{creation_string}"))
        # The expected alias is associated with the index
        self.assertEqual(
            list(indices_client.get_alias("richie_courses").keys())[0],
            f"richie_courses_{creation_string}",
        )

    # pylint: disable=unused-argument
    @mock.patch(
        "richie.apps.search.indexers.courses.CoursesIndexer.scripts",
        new={"script_id_A": "script body A", "script_id_B": "script body B"},
    )
    @mock.patch(
        "richie.apps.search.indexers.organizations.OrganizationsIndexer.scripts", new={}
    )
    @mock.patch(
        "richie.apps.search.indexers.categories.CategoriesIndexer.scripts",
        new={"script_id_C": "script body C"},
    )
    @mock.patch.object(ES_CLIENT, "put_script")
    def test_index_manager_store_es_scripts(self, mock_put_script, *args):
        """
        Make sure store_es_scripts iterates over all indexers to store their scripts and
        does not choke when there are (0 | 1 | 2+) scripts on an indexer.
        """
        store_es_scripts(None)
        mock_put_script.assert_any_call(body="script body A", id="script_id_A")
        mock_put_script.assert_any_call(body="script body B", id="script_id_B")
        mock_put_script.assert_any_call(body="script body C", id="script_id_C")
        self.assertEqual(mock_put_script.call_count, 3)


class ExOneIndexable:
    """First example indexable"""

    document_type = "example"
    index_name = "richie_example"
    mapping = {"properties": {"name": "text"}}


class ExTwoIndexable:
    """Second example indexable"""

    document_type = "stub"
    index_name = "richie_stub"
    mapping = {"properties": {"code": "keyword"}}
