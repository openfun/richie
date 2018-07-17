"""
Tests for the index_manager utilities
"""
from datetime import datetime
from unittest import mock

from django.conf import settings
from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone

import pytz
from elasticsearch.client import IndicesClient

from richie.apps.search.index_manager import (
    get_indexes_by_alias,
    perform_create_index,
    regenerate_indexes,
)
from richie.apps.search.utils.es_indices import IndicesList


class IndexManagerTestCase(TestCase):
    """
    Test the functions that generate and maintain our elasticsearch indexes.
    """

    def setUp(self):
        """
        Make sure all indexes are deleted before each new test is run.
        """
        super().setUp()
        self.indices_client = IndicesClient(client=settings.ES_CLIENT)
        self.indices_client.delete(index="_all")

    def test_get_indexes_by_alias(self):
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

    def test_get_indexes_by_alias_with_duplicate(self):
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

    def test_get_indexes_by_alias_empty(self):
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
    @override_settings(ES_CHUNK_SIZE=2)
    def test_perform_create_index(self):
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
            def get_data_for_es(self, index, action):
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
        self.assertEqual(settings.ES_CLIENT.count()["count"], 10)
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
    @override_settings(
        ES_INDICES=IndicesList(
            "example.ExOneIndexable",
            "example.ExTwoIndexable",
            "example.ExThreeIndexable",
        )
    )
    @mock.patch(
        "richie.apps.search.index_manager.get_indexable_from_string",
        lambda name: ExOneIndexable
        if name == "example.ExOneIndexable"
        else ExTwoIndexable,
    )
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
    def test_regenerate_indexes(self, *args):
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
                            "index": "richie_example_created_index",
                            "alias": "richie_example",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_stub_created_index",
                            "alias": "richie_stub",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_stub_created_index",
                            "alias": "richie_stub",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_example_forgotten",
                            "alias": "richie_example",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_example_previous",
                            "alias": "richie_example",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_stub_forgotten",
                            "alias": "richie_stub",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_stub_previous",
                            "alias": "richie_stub",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_stub_forgotten",
                            "alias": "richie_stub",
                        }
                    },
                    {
                        "remove": {
                            "index": "richie_stub_previous",
                            "alias": "richie_stub",
                        }
                    },
                ]
            }
        )
        self.indices_client.delete.assert_called_with(
            ignore=[400, 404], index="richie_orphan"
        )

    @override_settings(
        ES_INDICES=IndicesList(
            "example.ExOneIndexable",
            "example.ExTwoIndexable",
            "example.ExThreeIndexable",
        )
    )
    @mock.patch(
        "richie.apps.search.index_manager.get_indexable_from_string",
        lambda name: ExOneIndexable
        if name == "example.ExOneIndexable"
        else ExTwoIndexable,
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
    def test_regenerate_indexes_with_empty_index(self, *args):
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
                            "index": "richie_example_created_index",
                            "alias": "richie_example",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_stub_created_index",
                            "alias": "richie_stub",
                        }
                    },
                    {
                        "add": {
                            "index": "richie_stub_created_index",
                            "alias": "richie_stub",
                        }
                    },
                ]
            }
        )
        self.indices_client.delete.assert_not_called()


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
