"""Define SearchConfig as the default app configuration."""
from django.conf import settings

from .elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)

# pylint: disable=invalid-name
default_app_config = "richie.apps.search.apps.SearchConfig"


def new_elasticsearch_client():
    """
    Utility function to allow to test the `RICHIE_ES_CLIENT_KWARGS` setting.
    """
    return ElasticsearchClientCompat7to6(
        getattr(settings, "RICHIE_ES_HOST", ["elasticsearch"]),
        **getattr(settings, "RICHIE_ES_CLIENT_KWARGS", {}),
    )


ES_CLIENT = new_elasticsearch_client()

ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)
