"""Signals to update the Elasticsearch indices when page modifications are published."""

# Define the global ES_CLIENT and ES_INDICES_CLIENT variables

from django.apps import AppConfig
from django.conf import settings

from .elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)

ES_CLIENT = None
ES_INDICES_CLIENT = None


class SearchConfig(AppConfig):
    """Configuration class for the search app."""

    name = "richie.apps.search"
    verbose_name = "Richie search app"

    # pylint: disable=global-statement
    def init_es(self):
        """
        Initialize the Elasticsearch client and indices client.
        """
        global ES_CLIENT  
        ES_CLIENT = ElasticsearchClientCompat7to6(
            getattr(settings, "RICHIE_ES_HOST", ["elasticsearch"]),
        )
        global ES_INDICES_CLIENT
        ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)

    # pylint: disable=import-outside-toplevel,cyclic-import
    def init_signals(self):
        """Register signals to update the Elasticsearch indices."""
        from cms.signals import post_publish, post_unpublish

        from .signals import on_page_published, on_page_unpublished

        post_publish.connect(on_page_published, dispatch_uid="search_post_publish")
        post_unpublish.connect(
            on_page_unpublished, dispatch_uid="search_post_unpublish"
        )

    def ready(self):
        """
        Initialize the Elasticsearch client and register signals.
        """
        self.init_es()
        self.init_signals()
