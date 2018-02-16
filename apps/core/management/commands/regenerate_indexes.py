import logging

from django.core.management.base import BaseCommand

from ...es_index import regenerate_indexes

logger = logging.getLogger('fun_cms.core.regenerate_indexes')


class Command(BaseCommand):
    help = """
        Index all courses to Elasticsearch in bulk.
        This command creates a new index each time, populates it, and
        atomically replaces the old index once the new one is ready.
    """

    def handle(self, *args, **options):
        # Keep track of starting time for logging purposes
        logger.info('Starting to regenerate ES indexes...')

        # Delegate business logic to a dedicated module
        regenerate_indexes(logger)

        # Confirm operation success through a console log
        logger.info('ES Indexes regenerated')
