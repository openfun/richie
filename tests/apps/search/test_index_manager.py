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

from richie.apps.search import ES_CLIENT
from richie.apps.search.index_manager import (
    get_indexes_by_alias,
    perform_create_index,
    regenerate_indexes,
    store_es_scripts,
)


class IndexManagerTestCase(TestCase):
    """
    Test the functions that generate and maintain our elasticsearch indexes.
    """

    def setUp(self):
        """
        Make sure all indexes are deleted before each new test is run.
        """
        super().setUp()
        self.indices_client = IndicesClient(client=ES_CLIENT)
        self.indices_client.delete(index="_all")

    def test_index_manager_get_indexes_by_alias(self):
        """
        Receive a generator that contains the n-1 index for an alias.
        """
        alias = "richie_courses"
        existing_indexes = {
            "richie_courses_2014-05-04-03h12m33.123456s": {},
            "richie_courses_2015-05-04-03h12m33.123456s": {
                "aliases": {"richie_courses": True}
            },
            "richie_organizations_2017-05-04-03h12m33.123456s": {
                "aliases": {"richie_organizations": True}
            },
        }
        self.assertEqual(
            list(get_indexes_by_alias(existing_indexes, alias)),
            [("richie_courses_2015-05-04-03h12m33.123456s", "richie_courses")],
        )

    def test_index_manager_get_indexes_by_alias_with_duplicate(self):
        """
        Clean up the aliases when starting from a broken state: duplicate indexes for an alias.
        """
        alias = "richie_courses"
        existing_indexes = {
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
            list(get_indexes_by_alias(existing_indexes, alias)),
            [
                ("richie_courses_2014-05-04-03h12m33.123456s", "richie_courses"),
                ("richie_courses_2015-05-04-03h12m33.123456s", "richie_courses"),
            ],
        )

    def test_index_manager_get_indexes_by_alias_empty(self):
        """
        Don't wrongly push values when there is nothing to return.
        """
        alias = "richie_courses"
        existing_indexes = {
            "richie_courses_2013-05-04-03h12m33.123456s": {},
            "richie_organizations_2017-05-04-03h12m33.123456s": {
                "aliases": {"richie_organizations": True}
            },
        }
        self.assertEqual(list(get_indexes_by_alias(existing_indexes, alias)), [])

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

    # pylint: disable=no-member,unused-argument
    @mock.patch(
        "richie.apps.search.index_manager.get_indexes_by_alias",
        side_effect=lambda existing_indexes, alias: [
            (alias + "_forgotten", alias),
            (alias + "_previous", alias),
        ],
    )
    @mock.patch(
        "richie.apps.search.index_manager.perform_create_index",
        side_effect=lambda ix, *args: ix.index_name + "_created_index",
    )
    @mock.patch("elasticsearch.client.IndicesClient.delete")
    @mock.patch(
        "elasticsearch.client.IndicesClient.get_alias",
        return_value=dict({"richie_orphan": {}}),
    )
    @mock.patch("elasticsearch.client.IndicesClient.update_aliases")
    def test_index_manager_regenerate_indexes(self, *args):
        """
        Now test the general index regeneration behavior. We don't need to test the side-effects
        again as those have mostly been tested through perform_create_index.
        We mostly have to ensure the proper calls happen and the correct actions/deletions are
        passed to the indices_client.
        """
        regenerate_indexes(None)

        self.indices_client.update_aliases.assert_called_with(
            {
                "actions": [
                    {
                        "add": {
                            "index": "richie_categories_created_index",
                            "alias": "richie_categories",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_courses_created_index",
                            "alias": "richie_courses",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_organizations_created_index",
                            "alias": "richie_organizations",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_persons_created_index",
                            "alias": "richie_persons",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_categories_forgotten",
                            "alias": "richie_categories",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_categories_previous",
                            "alias": "richie_categories",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_courses_forgotten",
                            "alias": "richie_courses",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_courses_previous",
                            "alias": "richie_courses",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_organizations_forgotten",
                            "alias": "richie_organizations",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_organizations_previous",
                            "alias": "richie_organizations",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_persons_forgotten",
                            "alias": "richie_persons",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_persons_previous",
                            "alias": "richie_persons",
                        }
                    },
                ]
            }
        )
        self.indices_client.delete.assert_called_with(
            ignore=[400, 404], index="richie_orphan"
        )

    @mock.patch(
        "richie.apps.search.index_manager.get_indexes_by_alias",
        side_effect=lambda existing_indexes, alias: [],
    )
    @mock.patch(
        "richie.apps.search.index_manager.perform_create_index",
        side_effect=lambda ix, *args: ix.index_name + "_created_index",
    )
    @mock.patch("elasticsearch.client.IndicesClient.delete")
    @mock.patch("elasticsearch.client.IndicesClient.get_alias", return_value=dict({}))
    @mock.patch("elasticsearch.client.IndicesClient.update_aliases")
    def test_index_manager_regenerate_indexes_with_empty_index(self, *args):
        """
        Make sure `regenerate_indexes` still works when there are no existing indexes. This
        test case was added to reproduce a bug.
        """
        regenerate_indexes(None)

        self.indices_client.update_aliases.assert_called_with(
            {
                "actions": [
                    {
                        "add": {
                            "index": "richie_categories_created_index",
                            "alias": "richie_categories",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_courses_created_index",
                            "alias": "richie_courses",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_organizations_created_index",
                            "alias": "richie_organizations",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_persons_created_index",
                            "alias": "richie_persons",
                        }
                    },
                ]
            }
        )
        self.indices_client.delete.assert_not_called()

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
