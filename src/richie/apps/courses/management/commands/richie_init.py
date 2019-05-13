"""Create_demo_site management command."""
import logging

from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand

from richie.apps.core.helpers import recursive_page_creation

from ...defaults import PAGES_INFO

logger = logging.getLogger("richie.commands.core.richie_init")


class Command(BaseCommand):
    """Create the minimum site structure required by Richie."""

    help = __doc__

    def handle(self, *args, **options):
        """Call the `richie_init` function."""
        site = Site.objects.get(id=1)
        recursive_page_creation(site, PAGES_INFO)
