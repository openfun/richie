
from datetime import datetime
import pytz

from unittest import mock
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import OutputWrapper
from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone

from elasticsearch.client import IndicesClient

# An iterable of 6 courses to test bulk indexing
BULK_COURSES = [{'id': i, 'key': 'key_{:d}'.format(i)} for i in range(6)]


@mock.patch.object(OutputWrapper, 'write')  # Silence stdout
@override_settings(ES_MAPPING={'properties': {'key': {'type': 'keyword'}}})
class RegenerateIndexTestCase(TestCase):
    """
    Test the command that regenerates the Elasticsearch index for courses.
    """

    def setUp(self):
        """
        Make sure that all indexes are deleted before each new test is run.
        """
        super().setUp()
        self.indices_client = IndicesClient(client=settings.ES_CLIENT)
        self.indices_client.delete(index='_all')

    @mock.patch(
        'core.management.commands.regenerate_index.get_courses',
        return_value=[{'id': 1, 'key': 'key_1'}])
    def test_regenerate_index_creation_aliasing_and_deleting(self, mock_get, *args):
        """
        When run on an empty Elasticsearch, the "regenerate_index" command
        should create a new index and populate it.

        When run on an Elasticsearch with an existing course index, the
        "regenerate_index" command should create a new index and switch
        the alias to the new index upon successul creation.

        It should delete useless indexes automatically, keeping only the index in
        use and the one that was in use before running the "regenerate_index" command.
        """
        # Create the index a first time
        now = datetime(2015, 5, 4, 3, 12, 33, 123456, tzinfo=pytz.utc)
        with mock.patch.object(timezone, 'now', return_value=now):
            call_command('regenerate_index')
        self.indices_client.refresh()
        # Check that the records are indexed as expected
        expected_name1 = 'fun_cms_courses_2015-05-04-03h12m33.123456s'
        expected_index = {expected_name1: {'aliases': {'fun_cms_courses': {}}}}
        self.assertEqual(self.indices_client.get_alias('*'), expected_index)
        expected_mapping = {expected_name1: {'mappings': {'course': {'properties': {
            'id': {'type': 'long'}, 'key': {'type': 'keyword'}}}}}}
        self.assertEqual(self.indices_client.get_mapping(), expected_mapping)
        self.assertEqual(settings.ES_CLIENT.count()['count'], 1)

        # Regenerate the index a second time
        now = datetime(2017, 1, 3, tzinfo=pytz.utc)
        with mock.patch.object(timezone, 'now', return_value=now):
            call_command('regenerate_index')
        self.indices_client.refresh()
        # Check that the new index has replaced the first one
        expected_name2 = 'fun_cms_courses_2017-01-03-00h00m00.000000s'
        expected_index = {
            expected_name1: {'aliases': {}},
            expected_name2: {'aliases': {'fun_cms_courses': {}}}}
        self.assertEqual(self.indices_client.get_alias('*'), expected_index)
        self.assertEqual(settings.ES_CLIENT.count()['count'], 2)
        self.assertEqual(settings.ES_CLIENT.count(expected_name2)['count'], 1)

        # Regenerate the index a third time
        now = datetime(2018, 1, 23, tzinfo=pytz.utc)
        with mock.patch.object(timezone, 'now', return_value=now):
            call_command('regenerate_index')
        self.indices_client.refresh()
        # Check that the new index has replaced the second one and that
        # the first one is now deleted.
        expected_name3 = 'fun_cms_courses_2018-01-23-00h00m00.000000s'
        expected_index = {
            expected_name2: {'aliases': {}},
            expected_name3: {'aliases': {'fun_cms_courses': {}}}}
        self.assertEqual(self.indices_client.get_alias('*'), expected_index)
        self.assertEqual(settings.ES_CLIENT.count()['count'], 2)
        self.assertEqual(settings.ES_CLIENT.count(expected_name2)['count'], 1)

    @override_settings(ES_CHUNK_SIZE=2)
    @mock.patch('core.management.commands.regenerate_index.get_courses', return_value=BULK_COURSES)
    def test_regenerate_index_bulk(self, mock_get, *args):
        """
        Bulk indexing should work as expected when the number of records is higher than chunk size.
        """
        self.assertEqual(settings.ES_CHUNK_SIZE, 2)
        call_command('regenerate_index')
        self.indices_client.refresh()
        self.assertEqual(settings.ES_CLIENT.count()['count'], 6)
        self.assertEqual(
            settings.ES_CLIENT.get(index='fun_cms_courses', doc_type='course', id=1)['_source'],
            {'id': 1, 'key': 'key_1'})

    def test_regenerate_index_failure(self, *args):
        """
        When regenerating the index fails, the existing index in place should still work.
        """
        # Create a first index
        with mock.patch(
                'core.management.commands.regenerate_index.get_courses',
                return_value=[{'id': 1, 'key': 'key_1'}]):
            call_command('regenerate_index')
        self.indices_client.refresh()
        existing_index = self.indices_client.get_alias('fun_cms_courses')

        # Simulate a failure when regenerating the index
        class MyException(Exception):
            pass

        def effect():
            raise MyException

        with mock.patch(
                'core.management.commands.regenerate_index.get_courses', side_effect=effect):
            with self.assertRaises(MyException):
                call_command('regenerate_index')

        # The existing index should still be intact and targetted by the alias
        self.assertEqual(
            settings.ES_CLIENT.get(index='fun_cms_courses', doc_type='course', id=1)['_source'],
            {'id': 1, 'key': 'key_1'})
        self.assertEqual(self.indices_client.get_alias('fun_cms_courses'), existing_index)
