"""
Tests for the course viewset
"""
from unittest import mock

from django.db import connection
from django.test import TestCase

from richie.apps.courses.factories import (
    CategoryFactory,
    CourseFactory,
    OrganizationFactory,
)
from richie.apps.search.indexers.courses import CoursesIndexer


@mock.patch.object(  # Avoid messing up the development Elasticsearch index
    CoursesIndexer,
    "index_name",
    new_callable=mock.PropertyMock,
    return_value="test_courses",
)
@mock.patch("richie.apps.search.index_manager.bulk")  # Mock call to Elasticsearch
class CoursesSignalsTestCase(TestCase):
    """
    Test signals to keep the Elasticsearch indices up-to-date.
    """

    @staticmethod
    def run_commit_hooks():
        """
        Run commit hooks as if the database transaction had been successful.
        """
        while connection.run_on_commit:
            _sids, func = connection.run_on_commit.pop(0)
            func()

    def test_signals_courses_publish(self, mock_bulk, *_):
        """
        Publishing a course should update its document in the Elasticsearch courses index.
        """
        course = CourseFactory()
        self.run_commit_hooks()

        # Elasticsearch should not be called until the course is published
        self.assertFalse(mock_bulk.called)

        self.assertTrue(course.extended_object.publish("en"))
        course.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)

        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 1)
        action = mock_bulk.call_args[1]["actions"][0]
        self.assertEqual(action["_id"], str(course.public_extension.extended_object_id))
        self.assertEqual(action["_op_type"], "index")
        self.assertEqual(action["_type"], "course")

    def test_signals_courses_unpublish(self, mock_bulk, *_):
        """
        Unpublishing a course in a language should update its document in the Elasticsearch
        courses index or delete it if there is no language published anymore.
        """
        course = CourseFactory(page_languages=["en", "fr"], should_publish=True)
        self.run_commit_hooks()
        mock_bulk.reset_mock()

        # - Unpublish the first language
        self.assertTrue(course.extended_object.unpublish("en"))
        course.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)

        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 1)
        action = mock_bulk.call_args[1]["actions"][0]
        self.assertEqual(action["_id"], str(course.public_extension.extended_object_id))
        self.assertEqual(action["_op_type"], "index")
        self.assertEqual(action["_type"], "course")

        mock_bulk.reset_mock()

        # - Unpublish the second language
        self.assertTrue(course.extended_object.unpublish("fr"))
        course.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)

        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 1)
        action = mock_bulk.call_args[1]["actions"][0]
        self.assertEqual(action["_id"], str(course.public_extension.extended_object_id))
        self.assertEqual(action["_op_type"], "delete")
        self.assertEqual(action["_type"], "course")

    def test_signals_organizations_publish(self, mock_bulk, *_):
        """
        Publishing an organization should update its document in the Elasticsearch organizations
        index, and the documents for published courses to which it is related, excluding snapshots.
        """
        parent = OrganizationFactory(should_publish=True)
        organization = OrganizationFactory(page_parent=parent.extended_object)
        published_course, _unpublished_course = CourseFactory.create_batch(
            2, fill_organizations=[organization]
        )
        self.assertTrue(published_course.extended_object.publish("en"))
        published_course.refresh_from_db()
        self.run_commit_hooks()
        mock_bulk.reset_mock()

        self.assertTrue(organization.extended_object.publish("en"))
        organization.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 3)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-00010001")
        self.assertEqual(actions[1]["_op_type"], "index")
        self.assertEqual(actions[1]["_type"], "organization")
        self.assertEqual(actions[2]["_id"], "P-0001")
        self.assertEqual(actions[2]["_op_type"], "index")
        self.assertEqual(actions[2]["_type"], "organization")

    def test_signals_organizations_no_parent(self, mock_bulk, *_):
        """
        Publishing an organization should update its document in the Elasticsearch organizations
        index, and the documents for published courses to which it is related, excluding snapshots.
        """
        organization = OrganizationFactory()
        published_course, _unpublished_course = CourseFactory.create_batch(
            2, fill_organizations=[organization]
        )
        self.assertTrue(published_course.extended_object.publish("en"))
        published_course.refresh_from_db()
        self.run_commit_hooks()
        mock_bulk.reset_mock()

        self.assertTrue(organization.extended_object.publish("en"))
        organization.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 2)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-0001")
        self.assertEqual(actions[1]["_op_type"], "index")
        self.assertEqual(actions[1]["_type"], "organization")

    def test_signals_organizations_unpublish(self, mock_bulk, *_):
        """
        Unpublishing an organization in a language should update its document in the Elasticsearch
        organizations index or delete it if there is no language published anymore.
        It should also reindex the documents for published courses to which it is related,
        excluding snapshots.
        """
        organization = OrganizationFactory(
            page_languages=["en", "fr"], should_publish=True
        )
        published_course, _unpublished_course = CourseFactory.create_batch(
            2, fill_organizations=[organization]
        )
        self.assertTrue(published_course.extended_object.publish("en"))
        published_course.refresh_from_db()
        self.run_commit_hooks()
        mock_bulk.reset_mock()

        # - Unpublish the first language
        self.assertTrue(organization.extended_object.unpublish("en"))
        organization.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 2)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-0001")
        self.assertEqual(actions[1]["_op_type"], "index")
        self.assertEqual(actions[1]["_type"], "organization")

        mock_bulk.reset_mock()

        # - Unpublish the second language
        self.assertTrue(organization.extended_object.unpublish("fr"))
        organization.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 2)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-0001")
        self.assertEqual(actions[1]["_op_type"], "delete")
        self.assertEqual(actions[1]["_type"], "organization")

    def test_signals_categories_publish(self, mock_bulk, *_):
        """
        Publishing a category should update its document in the Elasticsearch categories
        index, and the documents for published courses to which it is related, excluding snapshots.
        """
        parent = CategoryFactory(should_publish=True)
        category = CategoryFactory(page_parent=parent.extended_object)
        published_course, _unpublished_course = CourseFactory.create_batch(
            2, fill_categories=[category]
        )
        self.assertTrue(published_course.extended_object.publish("en"))
        published_course.refresh_from_db()
        self.run_commit_hooks()
        mock_bulk.reset_mock()

        self.assertTrue(category.extended_object.publish("en"))
        category.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 3)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-00010001")
        self.assertEqual(actions[1]["_op_type"], "index")
        self.assertEqual(actions[1]["_type"], "category")
        self.assertEqual(actions[2]["_id"], "P-0001")
        self.assertEqual(actions[2]["_op_type"], "index")
        self.assertEqual(actions[2]["_type"], "category")

    def test_signals_categories_no_parent(self, mock_bulk, *_):
        """
        Publishing a category should update its document in the Elasticsearch categories
        index, and the documents for published courses to which it is related, excluding snapshots.
        """
        category = CategoryFactory()
        published_course, _unpublished_course = CourseFactory.create_batch(
            2, fill_categories=[category]
        )
        self.assertTrue(published_course.extended_object.publish("en"))
        published_course.refresh_from_db()
        self.run_commit_hooks()
        mock_bulk.reset_mock()

        self.assertTrue(category.extended_object.publish("en"))
        category.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 2)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-0001")
        self.assertEqual(actions[1]["_op_type"], "index")
        self.assertEqual(actions[1]["_type"], "category")

    def test_signals_categories_unpublish(self, mock_bulk, *_):
        """
        Unpublishing a category in one language should update its document in the Elasticsearch
        categories index or delete it if there is no language published anymore.
        It should also update the documents for published courses to which it is related
        excluding snapshots.
        """
        category = CategoryFactory(page_languages=["en", "fr"], should_publish=True)
        published_course, _unpublished_course = CourseFactory.create_batch(
            2, fill_categories=[category]
        )
        self.assertTrue(published_course.extended_object.publish("en"))
        published_course.refresh_from_db()
        self.run_commit_hooks()
        mock_bulk.reset_mock()

        # - Unpublish the first language
        self.assertTrue(category.extended_object.unpublish("en"))
        category.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 2)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-0001")
        self.assertEqual(actions[1]["_op_type"], "index")
        self.assertEqual(actions[1]["_type"], "category")

        mock_bulk.reset_mock()

        # - Unpublish the second language
        self.assertTrue(category.extended_object.unpublish("fr"))
        category.refresh_from_db()

        # Elasticsearch should not be called before the db transaction is successful
        self.assertFalse(mock_bulk.called)
        self.run_commit_hooks()

        self.assertEqual(mock_bulk.call_count, 1)
        self.assertEqual(len(mock_bulk.call_args[1]["actions"]), 2)
        actions = list(mock_bulk.call_args[1]["actions"])
        self.assertEqual(
            actions[0]["_id"], str(published_course.public_extension.extended_object_id)
        )
        self.assertEqual(actions[0]["_op_type"], "index")
        self.assertEqual(actions[0]["_type"], "course")
        self.assertEqual(actions[1]["_id"], "L-0001")
        self.assertEqual(actions[1]["_op_type"], "delete")
        self.assertEqual(actions[1]["_type"], "category")
