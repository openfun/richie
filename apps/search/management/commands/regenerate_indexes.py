"""
regenerate_indexes management command
"""
import logging

from django.core.management.base import BaseCommand

from ...index_manager import regenerate_indexes

logger = logging.getLogger("richie.core.regenerate_indexes")


class Command(BaseCommand):
    """
    Index all courses to Elasticsearch in bulk.
    This command creates a new index each time, populates it, and
    atomically replaces the old index once the new one is ready.
    """

    help = __doc__

    def handle(self, *args, **options):
        # Keep track of starting time for logging purposes
        logger.info("Starting to regenerate ES indexes...")

        # Delegate business logic to a dedicated module
        regenerate_indexes(logger)

        # Confirm operation success through a console log
        logger.info("ES Indexes regenerated")
