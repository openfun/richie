"""
Tests for the index_manager utilities
"""

from datetime import datetime, timezone
from unittest import mock

from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone as django_timezone

from elasticsearch.exceptions import NotFoundError

from richie.apps.courses.factories import CourseFactory
from richie.apps.search import ES_CLIENT, ES_INDICES_CLIENT
from richie.apps.search.index_manager import (
    ES_INDICES,
    get_indices_by_alias,
    perform_create_index,
    regenerate_indices,
    store_es_scripts,
)
from richie.apps.search.signals import apply_es_action_to_course


class IndexManagerTestCase(TestCase):
    """
    Test the functions that generate and maintain our elasticsearch indices.
    """

    def setUp(self):
        """
        Make sure all indices are deleted before each new test is run.
        """
        super().setUp()
        ES_INDICES_CLIENT.delete(index="_all")

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
                        "code": f"course-{i:d}",
                        "name": f"Course Number {i:d}",
                    }

        indexable = IndexableClass()

        # Set a fake time to check the name of the index
        now = datetime(2016, 5, 4, 3, 12, 33, 123456, tzinfo=timezone.utc)

        # Make sure our index is empty before we call the function
        self.assertEqual(ES_INDICES_CLIENT.get_alias("*"), {})

        mock_logger = mock.Mock(spec=["info"])

        with mock.patch.object(django_timezone, "now", return_value=now):
            new_index = perform_create_index(indexable, mock_logger)
        ES_INDICES_CLIENT.refresh()

        self.assertEqual(new_index, "richie_courses_2016-05-04-03h12m33.123456s")
        self.assertEqual(ES_CLIENT.count()["count"], 10)
        self.assertEqual(
            ES_INDICES_CLIENT.get_mapping(),
            {
                "richie_courses_2016-05-04-03h12m33.123456s": {
                    "mappings": {
                        "properties": {
                            "code": {"type": "keyword"},
                            "name": {"type": "text"},
                        }
                    }
                }
            },
        )
        mock_logger.info.assert_called()

    @mock.patch.object(
        ES_INDICES.categories,
        "index_name",
        new_callable=mock.PropertyMock,
        return_value="richie_test_categories",
    )
    @mock.patch.object(
        ES_INDICES.courses,
        "index_name",
        new_callable=mock.PropertyMock,
        return_value="richie_test_courses",
    )
    @mock.patch.object(
        ES_INDICES.organizations,
        "index_name",
        new_callable=mock.PropertyMock,
        return_value="richie_test_organizations",
    )
    @mock.patch.object(
        ES_INDICES.persons,
        "index_name",
        new_callable=mock.PropertyMock,
        return_value="richie_test_persons",
    )
    # pylint: disable=unused-argument
    def test_index_manager_regenerate_indices(self, *args):
        """
        Make sure indices are created, aliases updated and old, no longer useful indices
        are pruned when the `regenerate_elasticsearch` function is called.
        """
        # Create an unrelated index with an alias to make sure it is unaffected by our operations
        ES_INDICES_CLIENT.create(index="unrelated_index")
        ES_INDICES_CLIENT.put_alias(
            index="unrelated_index", name="unrelated_index_alias"
        )
        self.assertIsNotNone(
            ES_INDICES_CLIENT.get("unrelated_index")["unrelated_index"]
        )
        self.assertEqual(
            list(ES_INDICES_CLIENT.get_alias("unrelated_index_alias").keys())[0],
            "unrelated_index",
        )

        # Create all our indices from scratch
        # Use a mocked timezone.now to  check the names of our indices as they include a datetime
        creation1_datetime = datetime(2010, 1, 1, tzinfo=timezone.utc)
        creation1_string = creation1_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(django_timezone, "now", return_value=creation1_datetime):
            regenerate_indices(None)

        expected_indices = [
            "richie_test_categories",
            "richie_test_courses",
            "richie_test_organizations",
            "richie_test_persons",
        ]
        # All indices were created and properly aliased
        for alias_name in expected_indices:
            new_index_name = f"{alias_name}_{creation1_string}"
            # The index is created
            self.assertIsNotNone(ES_INDICES_CLIENT.get(new_index_name)[new_index_name])
            # The expected alias is associated with the index
            self.assertEqual(
                list(ES_INDICES_CLIENT.get_alias(alias_name).keys())[0], new_index_name
            )

        # Now regenerate the indices, replacing the ones we just created
        creation2_datetime = datetime(2011, 2, 2, tzinfo=timezone.utc)
        creation2_string = creation2_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(django_timezone, "now", return_value=creation2_datetime):
            regenerate_indices(None)

        # All indices were replaced and aliases updated
        for alias_name in expected_indices:
            # The index is created
            new_index_name = f"{alias_name}_{creation2_string}"
            self.assertIsNotNone(ES_INDICES_CLIENT.get(new_index_name)[new_index_name])
            # The expected alias is associated with the new index
            self.assertEqual(
                list(ES_INDICES_CLIENT.get_alias(alias_name).keys())[0], new_index_name
            )
            # The previous version of the index is still around
            creation1_index_name = f"{alias_name}_{creation1_string}"
            self.assertIsNotNone(
                ES_INDICES_CLIENT.get(creation1_index_name)[creation1_index_name]
            )
            # But not aliased any more
            self.assertEqual(
                ES_INDICES_CLIENT.get(creation1_index_name)[creation1_index_name][
                    "aliases"
                ],
                {},
            )

        # Regenerate indices again to make sure versions n-2 of indices are
        # deleted (not just unaliased)
        creation3_datetime = datetime(2012, 3, 3, tzinfo=timezone.utc)
        creation3_string = creation3_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(django_timezone, "now", return_value=creation3_datetime):
            regenerate_indices(None)

        # All indices were replaced and had their aliases changed
        for index_name in expected_indices:
            new_index_name = f"{index_name}_{creation3_string}"
            # The index is created
            self.assertIsNotNone(ES_INDICES_CLIENT.get(new_index_name)[new_index_name])
            # The expected alias is associated with the new index
            self.assertEqual(
                list(ES_INDICES_CLIENT.get_alias(index_name).keys())[0], new_index_name
            )
            # The previous version of the index is still around
            creation2_index_name = f"{alias_name}_{creation2_string}"
            self.assertIsNotNone(
                ES_INDICES_CLIENT.get(creation2_index_name)[creation2_index_name]
            )
            # But not aliased any more
            self.assertEqual(
                ES_INDICES_CLIENT.get(creation2_index_name)[creation2_index_name][
                    "aliases"
                ],
                {},
            )
            # Version n-2 of the index does not exist any more
            with self.assertRaises(NotFoundError):
                ES_INDICES_CLIENT.get(f"{index_name}_{creation1_string}")

        # Make sure our unrelated index was unaffected through regenerations
        self.assertIsNotNone(
            ES_INDICES_CLIENT.get("unrelated_index")["unrelated_index"]
        )
        self.assertEqual(
            list(ES_INDICES_CLIENT.get_alias("unrelated_index_alias").keys())[0],
            "unrelated_index",
        )

    @mock.patch.object(
        ES_INDICES.courses,
        "index_name",
        new_callable=mock.PropertyMock,
        return_value="richie_test_courses",
    )
    # pylint: disable=unused-argument
    def test_index_manager_regenerate_indices_from_broken_state(self, *args):
        """
        `regenerate_indices` should succeed and give us a working ElasticSearch
        when it runs and finds a broken state (eg. with an existing, incorrect
        index with the name of an alias).

        This can occur when ES restarts and an update signal is triggered before
        Richie had a chance to bootstrap ES.
        """
        # Create a course and trigger a signal to index it. This will create a
        # broken "richie_test_courses" index
        course = CourseFactory(should_publish=True)
        apply_es_action_to_course(course.extended_object, "index", "en")
        self.assertIsNotNone(ES_INDICES_CLIENT.get("richie_test_courses"))

        # Call our `regenerate_indices command`
        creation_datetime = datetime(2010, 1, 1, tzinfo=timezone.utc)
        creation_string = creation_datetime.strftime("%Y-%m-%d-%Hh%Mm%S.%fs")
        with mock.patch.object(django_timezone, "now", return_value=creation_datetime):
            regenerate_indices(None)

        # No error was thrown, the courses index (like all others) was bootstrapped
        self.assertIsNotNone(
            ES_INDICES_CLIENT.get(f"richie_test_courses_{creation_string}")
        )
        # The expected alias is associated with the index
        self.assertEqual(
            list(ES_INDICES_CLIENT.get_alias("richie_test_courses").keys())[0],
            f"richie_test_courses_{creation_string}",
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
    # pylint: disable=unused-argument
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

    index_name = "richie_example"
    mapping = {"properties": {"name": "text"}}


class ExTwoIndexable:
    """Second example indexable"""

    index_name = "richie_stub"
    mapping = {"properties": {"code": "keyword"}}
