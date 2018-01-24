
import time

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from elasticsearch.client import IndicesClient
from elasticsearch.exceptions import NotFoundError
from elasticsearch.helpers import bulk

from ...models import get_courses


class Command(BaseCommand):
    help = """
        Index all courses to Elasticsearch in bulk.
        This command creates a new index each time, populates it, and
        atomically replaces the old index once the new one is ready."""

    def handle(self, *args, **options):
        """
        This creates a new index and replaces the eventual existing index with
        the new one only once it has successfully built it.
        """
        alias = settings.ES_INDEX
        indices_client = IndicesClient(client=settings.ES_CLIENT)

        # Create a new index suffixing its name with a timestamp
        new_index = '{:s}_{:s}'.format(
            alias, timezone.now().strftime('%Y-%m-%d-%Hh%Mm%S.%fs'))

        # Get all existing indexes before creating a new one
        try:
            existing_indexes = indices_client.get_alias('*')
        except NotFoundError:
            existing_indexes = []

        # Create the new index
        self.stdout.write(
            'Creating a new Elasticsearch index "{:s}"...'.format(new_index), ending="")
        start = time.time()

        indices_client.create(index=new_index)
        indices_client.put_mapping(
            doc_type=settings.ES_COURSE_TYPE, body=settings.ES_MAPPING, index=new_index)

        # Populate the new index
        bulk(
            client=settings.ES_CLIENT, stats_only=True, chunk_size=settings.ES_CHUNK_SIZE,
            actions=self.get_courses_for_elasticsearch(new_index, 'create'))

        # Once the new index is ready, update our alias
        actions = [{'add': {'index': new_index, 'alias': alias}}]
        useless_indexes = []
        for index, details in existing_indexes.items():
            # Unlink from alias, pre-existing indexes linked to our alias
            if alias in details['aliases'].keys():
                actions.append({'remove': {'index': index, 'alias': alias}})
            # Delete indexes that are not linked to any alias,
            # We are keeping only the new index and the latest one
            elif not details['aliases']:
                useless_indexes.append(index)
        # We replace the index targeted by our alias in 1 atomic operation to avoid outage
        indices_client.update_aliases(dict(actions=actions))
        if useless_indexes:
            indices_client.delete(index=useless_indexes, ignore=[400, 404])

        elapsed = ' ({:.3f}s)'.format(time.time() - start)
        self.stdout.write(self.style.SUCCESS(' OK' + elapsed))

    def get_courses_for_elasticsearch(self, index, action):
        """
        Wrapper on a course generator to add metadata for Elasticsearch.
        """
        for course in get_courses():
            course['_index'] = index
            course['_type'] = settings.ES_COURSE_TYPE
            course['_id'] = course['id']
            course['_op_type'] = action
            yield course
