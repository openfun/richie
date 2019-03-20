"""Signals to update the Elasticsearch indexes when page modifications are published."""
from django.apps import AppConfig


class SearchConfig(AppConfig):
    """Configuration class for the search app."""

    name = "richie.apps.search"
    verbose_name = "Richie search app"

    def ready(self):
        """Register signals to update the Elasticsearch indexes."""
        from cms.signals import post_publish
        from .signals import on_page_publish

        post_publish.connect(on_page_publish, dispatch_uid="search_post_publish")
